const FOLDER_FIELDS = [
  'id',
  'label',
  'parent',
  'created',
  'updated',
  'edited',
  'revision',
  'cseType',
  'sseType',
  'hidden',
  'trashed',
  'favorite',
]

export const ROOT_FOLDER = '00000000-0000-0000-0000-000000000000'

export class Folders {
  setDb (db) {
    this.db = db
  }

  setHttp (http) {
    this.http = http
  }

  _executeSql (query, data = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction((txn) => {
        txn.executeSql(query, data,
          (txn, data) => resolve(data),
          (txn, err) => {
            if (__DEV__) console.log(err)
            reject(err)
          }
        )
      })
    })
  }

  async createTable () {
    await this._executeSql(`
      create table if not exists folders(
        id string primary key not null,
        label string,
        parent string,
        created integer,
        updated integer,
        edited integer,
        revision string,
        cseType string,
        sseType string,
        hidden integer,
        trashed integer,
        favorite integer
      )`)
    await this._executeSql(`create index if not exists folders_parent on folders(parent)`)
    await this._executeSql(`create index if not exists folders_hidden on folders(hidden)`)
    await this._executeSql(`create index if not exists folders_trashed on folders(trashed)`)
    await this._executeSql(`create index if not exists folders_favorite on folders(favorite)`)
  }

  saveList (list) {
    return new Promise((resolve, reject) => {
      this.db.transaction((txn) => {
        Promise.all(list.map((obj) => this.objectToRow(obj))
          .map(row => {
            return this.saveRow(txn, row)
          }))
          .then(resolve)
          .catch(reject)
      })
    })
  }

  saveRow (txn, row) {
    let questions = FOLDER_FIELDS.map((field) => '?').join(',')
    return this._executeSql(`insert or replace into folders values (${questions})`, row)
  }

  rowToObject (row) {
    let labels = [
      'id',
      'label',
      'parent',
      'created',
      'updated',
      'edited',
      'revision',
      'cseType',
      'sseType',
      'hidden',
      'trashed',
      'favorite',
    ]
    let ret = {}
    labels.forEach((label, pos) => { ret[label] = row[pos] })
    return ret
  }

  objectToRow (object) {
    return [
      object.id,
      object.label,
      object.parent,
      object.created,
      object.updated,
      object.edited,
      object.revision,
      object.cseType,
      object.sseType,
      object.hidden,
      object.trashed,
      object.favorite,
    ]
  }

  async fetchAll () {
    try {
      let { data, status } = await this.http.post('/api/1.0/folder/list', { detailLevel: 'model+parent+folders+passwords' })
      data = Object.keys(data).map((key) => data[key])
      if (__DEV__) console.log(data[0])

      await this.deleteAll()
      await this.saveList(data)

      return { status, data }
    } catch (error) {
      if (__DEV__) console.log(`error while getting folders ${error}`)
      return {
        error,
        status: error.response.status
      }
    }
  }

  async getAll (fields = FOLDER_FIELDS) {
    try {
      fields = fields.filter((field) => FOLDER_FIELDS.indexOf(field) !== -1).join(',')
      let { rows } = await this._executeSql(`select ${fields} from folders where hidden=0 and trashed=0`)
      return rows._array
    } catch (err) {
      if (__DEV__) console.log('error getting data', err)
      return []
    }
  }

  async getItem (id) {
    try {
      let { rows } = await this._executeSql('select * from folders where id=?', [id])
      return rows._array[0]
    } catch (err) {
      if (__DEV__) console.log('error getting data', err)
      return []
    }
  }

  async getChildren (folderId, fields = FOLDER_FIELDS) {
    let { rows } = await this._executeSql(`select ${fields.join(',')}
                                          from folders where parent=? and hidden=0 and trashed=0`, [folderId])
    return rows._array
  }

  async getFavoriteChildren (folderId, fields = FOLDER_FIELDS) {
    let { rows } = await this._executeSql(`select ${fields.join(',')}
                                          from folders where parent=?
                                          and hidden=0 and trashed=0
                                          and favorite=1`, [folderId])
    return rows._array
  }

  async deleteAll () {
    return this._executeSql(`delete from folders`)
  }
}

export default new Folders()
