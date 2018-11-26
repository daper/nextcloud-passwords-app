import axios from 'axios'
import { Platform } from "react-native"
import SQLite, { encodeName } from 'react-native-sqlcipher-2'
import fs from 'react-native-fs'
import Passwords from './passwords'
export { default as Passwords } from './passwords'
import Folders from './folders'
export {
  default as Folders,
  ROOT_FOLDER,
} from './folders'

export const Colors = {
  bgColor: '#0082c9',
}

const DB_NAME = 'nextcloud.db'

export class API {
  models = [Passwords, Folders]

  constructor() {
    this.credentials = null
    this.instance = null
  }

  init(settings) {
    this.credentials = settings
    let {user, password} = this.credentials

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
      headers: {'OCS-APIRequest': 'true'},
      rejectUnauthorized: false,
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

  async openDB() {
    if (this.credentials.password === "") {
      return new Error('Cannot open DB. Invalid master password')
    } else if (!this.db) {
      this.db = SQLite.openDatabase(encodeName(DB_NAME, this.credentials.password), '1.0', '', 200)
      this.models.forEach((model) => model.setDb(this.db))

      await Promise.all(this.models.map((model) => model.createTable()))
    }
  }

  async dropDB() {
    let rootDir = Platform.select({
      ios: fs.MainBundlePath,
      android: fs.DocumentDirectoryPath,
    })

    return fs.unlink(`${rootDir}/${DB_NAME}`)
    .then(() => {
      if (__DEV__) console.log('FILE DELETED');
    })
    .catch((err) => {
      if (__DEV__) console.log(err.message);
    });
  }

  async validateServer() {
    //curl -u username:password -X GET 'https://cloud.example.com/ocs/v1.php/...' -H "OCS-APIRequest: true"
    try {
      let {data, status} = await axios.get('/ocs/v1.php/cloud/capabilities', {
        baseURL: `${this.credentials.server}`,
        timeout: 10 * 1000,
        headers: {'OCS-APIRequest': 'true'},
        rejectUnauthorized: false,
        auth: {
          username: this.credentials.user,
          password: this.credentials.password,
        }
      })
      return {
        data, status,
        error: null,
      }
    } catch(err) {
      return {
        data: {},
        status: (err.response || {}).status,
        error: err,
      }
    }
  }  
}

export default new API()