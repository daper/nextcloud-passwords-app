import axios from 'axios'
import { Platform } from "react-native"
import SQLite, { encodeName } from 'react-native-sqlcipher-2'
import fs from 'react-native-fs'
import {store} from './index'

export const Colors = {
  bgColor: '#0082c9',
}

const DB_NAME = 'nextcloud.db'
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

export class API {
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
			baseURL: `${this.credentials.server}`,
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
	}

	async openDB() {
		return new Promise((res, rej) => {
			if (this.credentials.password === "") {
				return new Error('Cannot open DB. Invalid master password')
			} else if (!this.db) {
				this.db = SQLite.openDatabase(encodeName(DB_NAME, this.credentials.password), '1.0', '', 200)
				this.db.transaction((txn) => {
					txn.executeSql(`create table if not exists passwords(
						id string primary key not null,
						label string,
						username string,
						password string,
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
					)`, [],
					() => {res()},
					(txn, err) => {
						if (__DEV__) console.log(err)
						rej(err)
					})
				})
			}
		})
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
			let {data, status} = await this.instance.get('/ocs/v1.php/cloud/capabilities')
			return {
				data, status,
				error: null,
			}
		} catch(err) {
			return {
				data: {},
				status: err.response.status,
				error: err,
			}
		}
	}

	async deleteAllPasswords() {
		return await new Promise((res, rej) => {
			this.db.transaction((txn) => {
				txn.executeSql(`delete from passwords`, [], 
					(txn, data) => {res()},
					(txn, err) => {rej(err)})
			})
		})
	}

	async fetchList() {
		if (__DEV__) console.log('called API.fetchList')
		try {
			let {data, status} = await this.instance.get('/index.php/apps/passwords/api/1.0/password/list', 
				{params: {detailLevel: 'model+folder'}})
			if (__DEV__) console.log(`passwords server answer status: ${status}`)
			data = Object.keys(data).map((key) => data[key])
			if (__DEV__) console.log(data[0])

			await this.deleteAllPasswords()
			await this.saveList(data)

			return { status, data }
		} catch (error) {
			if (__DEV__) console.log(`error while getting passwords ${error}`)
			return {
				error,
				status: error.response.status
			}
		}
	}

	async getList(fields = []) {
		if (__DEV__) console.log('called API.getList')
		try {
			let {rows} = await new Promise((res, rej) => {
				this.db.transaction((txn) => {
					if (fields.length === 0) {
						fields = PASSWORD_FIELDS
					}

					fields = fields.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')
					txn.executeSql(`select ${fields} from passwords`, [],
						(txn, data) => {res(data)},
						(txn, err) => {rej(err)})
				})
			})

			return rows._array
		} catch (err) {
			if (__DEV__) console.log('error getting data', err)
			return []
		}
	}

	async search(value, fieldsToSearch = [], fieldsToRetrieve = []) {
		if (fieldsToSearch.length === 0) fieldsToSearch = PASSWORD_FIELDS
		if (fieldsToRetrieve.length === 0) fieldsToRetrieve = PASSWORD_FIELDS

		fieldsToSearch = fieldsToSearch
												.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1)
												.map((field) => `${field} like ?`)
		values = fieldsToSearch.map(() => `%${value}%`)
		fieldsToRetrieve = fieldsToRetrieve.filter((field) => PASSWORD_FIELDS.indexOf(field) !== -1).join(',')

		try {
			let {rows} = await new Promise((res, rej) => {
				this.db.transaction((txn) => {
					txn.executeSql(`
						select ${fieldsToRetrieve}
						from passwords
						where ${fieldsToSearch.join(' or ')}
					`, values,
					(txn, data) => {res(data)},
					(txn, err) => {rej(err)})
				})
			})

			return rows._array
		} catch (err) {
			if (__DEV__) console.log('error searching data', err)
			return []
		}
	}

	async getPassword(id) {
		return await new Promise((res, rej) => {
			this.db.transaction((txn) => {
				txn.executeSql(`select password from passwords where id=?`, [id], 
					(txn, data) => {res(data.rows._array[0].pass)},
					(txn, err) => {rej(err)})
			})
		})
	}

	async getItem(id) {
		return await new Promise((res, rej) => {
			this.db.transaction((txn) => {
				txn.executeSql(`select * from passwords where id=?`, [id], 
					(txn, data) => {res(data.rows._array[0])},
					(txn, err) => {rej(err)})
			})
		})
	}

	async deleteItem(id) {
		return await new Promise((res, rej) => {
			this.instance.delete('/index.php/apps/passwords/api/1.0/password/delete', {params: {id}})
				.then(() => {
					this.db.transaction((txn) => {
						txn.executeSql(`delete from passwords where id=?`, [id],
							(txn, data) => {res()},
							(txn, err) => {rej(err)})
					})
				})
				.catch((err) => {
					if (__DEV__) console.log('error while deleting', err)
						rej(err)
				})
		})
	}

	async updateItem(item) {
		return await new Promise((res, rej) => {
			this.instance.patch('/index.php/apps/passwords/api/1.0/password/update', '', {params:{...item}})
				.then(() => {
					this.db.transaction((txn) => {
						let cols = Object.keys(item).filter((col) => [...PASSWORD_FIELDS, 'password'].indexOf(col) !== -1)
						let values = cols.map((key) => item[key])
						cols = cols.map((col) => `${col}=?`).join(',')
						values.push(item.id)

						txn.executeSql(`update passwords set ${cols} where id=?`, values,
							(txn, data) => {res()},
							(txn, err) => {rej(err)})
					})
				})
				.catch((err) => {
					if (__DEV__) console.log('error while updating', err)
						rej(err)
				})
		})
	}

	saveList(list) {
		return new Promise((res, rej) => {
			this.db.transaction((txn) => {
				Promise.all(list.map((obj) => this.objectToRow(obj))
					.map(row => {
						return this.saveRow(txn, row)
					}))
				.then(res)
				.catch(rej)
			})			
		})
	}

	saveRow(txn, row) {
		return new Promise((res, rej) => {
			txn.executeSql('insert or replace into passwords values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', row,
				(txn, data) => {res(data)},
				(txn, err) => {
					if (__DEV__) console.log('This row has failed:', row)
					if (__DEV__) console.log(err)
					rej(err)
				})
		})
	}

	rowToObject(row) {
		let labels = [
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
		let ret = {}
		labels.forEach((label, pos) => ret[label] = row[pos])
		return ret
	}

	objectToRow(object) {
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
}

export default new API()