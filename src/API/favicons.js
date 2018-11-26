import url from 'url'
import Passwords from './passwords'

export class Favicons {
  setDb(db) {
    this.db = db
  }

  setHttp(http) {
    this.http = http
  }

  _executeSql(query, data = []) {
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

  async createTable() {
    //await this._executeSql('drop table if exists favicons')
    return await this._executeSql(`
      create table if not exists favicons(
        id string primary key not null,
        data string,
        updated integer,
        foreign key(id) references passwords(id)
      )`)
  }

  rowToObject(row) {
    let labels = [
      'id',
      'data',
      'updated',
    ]
    let ret = {}
    labels.forEach((label, pos) => ret[label] = row[pos])
    return ret
  }

  objectToRow(object) {
    return [
      (object.id || null),
      object.data,
      object.updated,
    ]
  }

  async fetchItem(id) {
    let item = await Passwords.getItem(id)
    let {hostname} = url.parse(item.url)
    let {data, headers} = await this.http.get(`/api/1.0/service/favicon/${hostname}/32`, {
      responseType: 'arraybuffer'
    })

    let faviconItem = {
      id: item.id,
      data: '',
      updated: new Date().getTime()
    }

    if (data.byteLength) {
      let base64Image = btoa([].reduce.call(new Uint8Array(data), (p, c) => p+String.fromCharCode(c), ''))
      let imageSrc = `data:${headers['content-type']};base64,${base64Image}`
      faviconItem.data = imageSrc
    }

    return faviconItem
  }

  async getItem(id) {
    let {rows} = await this._executeSql(`select * from favicons where id=?`, [id])
    return rows._array[0]
  }

  async getOrFetchItem(id) {
    let item = await this.getItem(id)
    if (!item) {
      try {
        item = await this.fetchItem(id)
        await this.saveItem(item)
      } catch(err) {
        if (__DEV__) console.log(err)
      }
    } else if (!item.data) {
      let elapsed = (new Date().getTime()) - item.updated
      if (elapsed > 1000 * 60 * 60 * 24 * 2) {
        try {
          item = await this.fetchItem(id)
          await this.saveItem(item)
        } catch(err) {
          if (__DEV__) console.log(err)
        }
      }
    }

    return item
  }

  async saveItem(item) {
    let row = this.objectToRow(item)
    return this._executeSql(`insert or replace into favicons values (?, ?, ?)`, row)
  }

  async deleteAll() {
    return await this._executeSql(`delete from favicons`)
  }
}

export default new Favicons()