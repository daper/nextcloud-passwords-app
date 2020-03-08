const PASSWORD_FIELDS = [
  'id',
  'label',
  'username',
  // 'password',
  'url',
  'notes',
  'customFields',
  'status',
  'statusCode',
  'hash',
  'folder',
  'revision',
  'share',
  'cseType',
  'sseType',
  'hidden',
  'trashed',
  'favorite',
  'editable',
  'edited',
  'created',
  'updated',
]

export class Passwords {
  setDb (db) {
    this.db = db
  }

  setHttp (http) {
    this.http = http
  }

  _executeSql (query, data = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'))
      } else {
        this.db.transaction((txn) => {
          txn.executeSql(query, data,
            (txn, data) => resolve(data),
            (txn, err) => {
              if (__DEV__) console.log(err)
              reject(err)
            }
          )
        })
      }
    })
  }

  async createTable () {
    await this._executeSql(`
      create table if not exists passwords(
        id string primary key not null,
        label string,
        username string,
        password blob,
        url string,
        notes string,
        customFields string,
        status integer,
        statusCode string,
        hash string,
        folder string,
        revision string,
        share string,
        cseType string,
        sseType string,
        hidden integer,
        trashed integer,
        favorite integer,
        editable integer,
        edited integer,
        created integer,
        updated integer
      )`)
    await this._executeSql('create index if not exists passwords_folder on passwords(folder)')
    await this._executeSql('create index if not exists passwords_favorite on passwords(favorite)')
    await this._executeSql('create index if not exists passwords_hidden on passwords(hidden)')
    await this._executeSql('create index if not exists passwords_trashed on passwords(trashed)')
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
    const questions = [...PASSWORD_FIELDS, '?'].map((field) => '?').join(',')
    return this._executeSql(`insert or replace into passwords values (${questions})`, row)
  }

  rowToObject (row) {
    const labels = [
      'id',
      'label',
      'username',
      'password',
      'url',
      'notes',
      'customFields',
      'status',
      'statusCode',
      'hash',
      'folder',
      'revision',
      'share',
      'cseType',
      'sseType',
      'hidden',
      'trashed',
      'favorite',
      'editable',
      'edited',
      'created',
      'updated',
    ]
    const ret = {}
    labels.forEach((label, pos) => { ret[label] = row[pos] })
    return ret
  }

  objectToRow (object) {
    return [
      object.id,
      object.label,
      object.username,
      object.password,
      object.url,
      object.notes,
      object.customFields,
      object.status,
      object.statusCode,
      object.hash,
      object.folder,
      object.revision,
      object.share,
      object.cseType,
      object.sseType,
      object.hidden,
      object.trashed,
      object.favorite,
      object.editable,
      object.edited,
      object.created,
      object.updated,
    ]
  }

  async fetchAll () {
    try {
      let { data, status } = await this.http.post('/api/1.0/password/list', { detailLevel: 'model+folder' })
      data = Object.keys(data).map((key) => data[key])
      if (__DEV__) console.log(data[0])

      await this.deleteAll()
      await this.saveList(data)

      return { status, data }
    } catch (error) {
      if (__DEV__) console.log(`error while getting passwords ${error}`)
      return {
        error,
        status: (error.response || {}).status || undefined
      }
    }
  }

  async getAll (fields = []) {
    try {
      if (fields.length === 0) {
        fields = PASSWORD_FIELDS
      }

      fields = fields.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')
      const { rows } = await this._executeSql(`select ${fields} from passwords where hidden=0 and trashed=0`)
      return rows._array
    } catch (err) {
      if (__DEV__) console.log('error getting data', err)
      return []
    }
  }

  async deleteAll () {
    return this._executeSql('delete from passwords')
  }

  async fetchItem (id) {
    try {
      const { status, data } = await this.http.post('/api/1.0/password/show', { id })
      if (status === 200) {
        return data
      } else {
        return new Error('Invalid API response while retrieving password')
      }
    } catch (err) {
      if (__DEV__) console.log(err)
      return new Error('Invalid API response while retrieving password')
    }
  }

  async getItem (id) {
    const { rows } = await this._executeSql('select * from passwords where id=?', [id])
    return rows._array[0]
  }

  async updateItem (item) {
    try {
      const currentItem = await this.fetchItem(item.id)
      item = { ...currentItem, ...item }
      await this.http.patch('/api/1.0/password/update', '', { params: { ...item } })

      let cols = Object.keys(item).filter((col) => [...PASSWORD_FIELDS, 'password'].indexOf(col) !== -1)
      const values = cols.map((key) => item[key])
      cols = cols.map((col) => `${col}=?`).join(',')
      values.push(item.id)

      await this._executeSql(`update passwords set ${cols} where id=?`, values)
    } catch (err) {
      if (__DEV__) console.log('error while updating', err)
    }
  }

  async deleteItem (id) {
    try {
      await this.http.delete('/api/1.0/password/delete', { params: { id } })
      await this._executeSql('delete from passwords where id=?', [id])
    } catch (err) {
      if (__DEV__) console.log('error while deleting', err)
    }
  }

  async search (value, fieldsToSearch = [], fieldsToRetrieve = []) {
    if (fieldsToSearch.length === 0) fieldsToSearch = PASSWORD_FIELDS
    if (fieldsToRetrieve.length === 0) fieldsToRetrieve = PASSWORD_FIELDS

    fieldsToSearch = fieldsToSearch
      .filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1)
      .map((field) => `${field} like ?`)
    const values = fieldsToSearch.map(() => `%${value}%`)
    fieldsToRetrieve = fieldsToRetrieve.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')

    try {
      const { rows } = await this._executeSql(`
            select ${fieldsToRetrieve}
            from passwords
            where ${fieldsToSearch.join(' or ')}
          `, values)

      return rows._array
    } catch (err) {
      if (__DEV__) console.log('error searching data', err)
      return []
    }
  }

  async getPassword (id) {
    const { rows } = await this._executeSql('select password from passwords where id=?', [id])
    return rows._array[0].password
  }

  async generateDefaultPassword (settings = null) {
    try {
      if (settings === null) {
        const { data } = await this.http.get('/api/1.0/service/password')
        return data
      } else {
        const { data } = await this.http.post('/api/1.0/service/password', { ...settings })
        return data
      }
    } catch (err) {
      return new Error('Error while asking for new password')
    }
  }

  async setFavorite (id, enable = null) {
    const passwordData = await this.fetchItem(id)
    if (enable === null) {
      passwordData.favorite = !passwordData.favorite
    } else {
      passwordData.favorite = enable
    }

    try {
      const { status } = await this.http.patch('/api/1.0/password/update', passwordData)

      if (status === 200) {
        await this.updateItem(passwordData)
        return passwordData
      } else {
        return new Error('Invalid API response')
      }
    } catch (err) {
      if (__DEV__) console.log(err)
      return err
    }
  }

  async create (item) {
    if (!item.password || !item.label) {
      return new Error('Invalid item to create')
    }

    try {
      const { status, data } = await this.http.post('/api/1.0/password/create', item)

      if (status === 201) {
        item.id = data.id
        let cols = Object.keys(item).filter((col) => [...PASSWORD_FIELDS, 'password'].indexOf(col) !== -1)
        const values = cols.map((key) => item[key])
        const questions = values.map(() => '?').join(',')
        cols = cols.join(',')

        await this._executeSql(`insert into passwords(${cols}) values(${questions})`, values)
        return data
      } else {
        return new Error('Invalid API response')
      }
    } catch (err) {
      if (__DEV__) console.log(err)
    }
  }

  async getFromFolder (folderId, fields = []) {
    if (fields.length === 0) {
      fields = PASSWORD_FIELDS
    }

    fields = fields.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')
    const { rows } = await this._executeSql(`select ${fields} from passwords where folder=? and hidden=0 and trashed=0`, [folderId])
    return rows._array
  }

  async getAllFavorites (fields = []) {
    try {
      if (fields.length === 0) {
        fields = PASSWORD_FIELDS
      }

      fields = fields.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')
      const { rows } = await this._executeSql(`select ${fields} from passwords where hidden=0 and trashed=0 and favorite=1`)
      return rows._array
    } catch (err) {
      if (__DEV__) console.log('error getting data', err)
      return []
    }
  }

  async getFavoritesFromFolder (folderId, fields = PASSWORD_FIELDS) {
    fields = fields.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')
    const { rows } = await this._executeSql(`select ${fields} from passwords where folder=?
                                        and hidden=0 and trashed=0 and favorite=1`, [folderId])
    return rows._array
  }
}

export default new Passwords()
