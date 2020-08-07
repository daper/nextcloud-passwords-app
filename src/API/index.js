import axios from 'axios'
import { Platform } from 'react-native'
import SQLite, { encodeName } from 'react-native-sqlcipher-2'
import fs from 'react-native-fs'
import Passwords from './passwords'
import Folders from './folders'
export { default as Passwords } from './passwords'
export {
  default as Folders,
  ROOT_FOLDER,
} from './folders'

export const Colors = {
  bgColor: '#0082c9',
  grey: '#414142'
}

const DB_NAME = 'nextcloud.db'

export class API {
  models = [Passwords, Folders]

  constructor () {
    this.credentials = null
    this.instance = null
  }

  init (settings) {
    this.credentials = settings
    const { user, password } = this.credentials

    let auth = {}
    if (user && password) {
      auth = {
        username: user,
        password: password
      }
    }

    this.instance = axios.create({
      baseURL: `${this.credentials.server}/index.php/apps/passwords`,
      timeout: 2 * 60 * 1000,
      headers: { 'OCS-APIRequest': 'true' },
      auth
    })

    this.instance.interceptors.request.use(request => {
      if (__DEV__) console.log('Starting Request', request)
      return request
    })

    this.instance.interceptors.response.use(response => {
      if (__DEV__) console.log('Response:', response)
      return response
    })

    this.models.forEach((model) => model.setHttp(this.instance))
  }

  async openDB (dbName, _debugSrc) {
    if (__DEV__) console.log(`Called openDB(${dbName}) from ${_debugSrc}`, this.db)

    if (this.credentials.password === '') {
      return new Error('Cannot open DB. Invalid master password')
    } else if (!this.db) {
      this.db = await new Promise((resolve, reject) => {
        const db = SQLite.openDatabase(encodeName(dbName, this.credentials.password), '1.0', '', 200, () => {
          resolve(db)
        })
      })

      if (__DEV__) {
        console.log(`Got DB(${dbName}):`, this.db)

        const rootDir = Platform.select({
          ios: fs.MainBundlePath,
          android: fs.DocumentDirectoryPath,
        })

        let dbPath = `${rootDir}/${dbName}`

        try {
          await fs.stat(dbPath)
            .then((statResult) => {
              console.log('DB File Stat', statResult)
            })
        } catch(e) {
          console.log(`Looks like the fs call failed to ${dbPath}`)
        }
      }

      this.models.forEach((model) => model.setDb(this.db))

      await Promise.all(this.models.map((model) => model.createTable()))
    }
  }

  async dropDB (dbName) {
    this.db = null

    const rootDir = Platform.select({
      ios: fs.MainBundlePath,
      android: fs.DocumentDirectoryPath,
    })

    return fs.unlink(`${rootDir}/${dbName}`)
      .then(() => {
        if (__DEV__) console.log('FILE DELETED')
      })
      .catch((err) => {
        if (__DEV__) console.log(err.message)
      })
  }

  async validateServer () {
    // curl -u username:password -X GET 'https://cloud.example.com/ocs/v1.php/...' -H "OCS-APIRequest: true"
    try {
      const { data, status } = await axios.get('/ocs/v1.php/cloud/capabilities', {
        baseURL: `${this.credentials.server}`,
        timeout: 10 * 1000,
        headers: { 'OCS-APIRequest': 'true' },
        auth: {
          username: this.credentials.user,
          password: this.credentials.password,
        }
      })
      return {
        data,
        status,
        error: null,
      }
    } catch (err) {
      return {
        data: {},
        status: (err.response || {}).status,
        error: err,
      }
    }
  }
}

export default new API()
