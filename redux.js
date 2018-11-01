import { compose, applyMiddleware, createStore } from "redux"
import { persistStore, persistCombineReducers } from "redux-persist"
import createSensitiveStorage from "redux-persist-sensitive-storage"
import API from './API'

// Actions
export function setLoading(status = null, text = 'Loading...') {
	return {
		type: 'loading',
		status, text
	}
}

export function setSettings(settings) {
	return {
		type: 'settings',
		settings
	}
}

export function pushPassword(item) {
	return {
		type: 'push-password',
		item
	}
}

export function setOrigPasswordList(list) {
	return {
		type: 'orig-passwords',
		list
	}
}

export function setPasswordList(list) {
	return {
		type: 'password-list',
		list
	}
}

export function setAuthFlow(status) {
	return {
		type: 'auth-flow',
		status
	}
}

export function touchLastLogin() {
	return {
		type: 'touch-last-login',
		timestamp: new Date().getTime()
	}
}

export function setLastLogin(ts) {
	return {
		type: 'set-last-login',
		timestamp: ts
	}
}

export function pushRoute(route) {
	return {
		type: 'push-route',
		route
	}
}

export function setPasswordFilter(filter) {
	return {
		type: 'set-password-filter',
		filter
	}
}

// Reducers
var defaultState = {
	loading: false,
	statusText: 'Contacting Server...',
	authFlow: false,
	lastLogin: 0,
	lastRoute: '',
	settings: {
		server: '',
		user: '',
		password: '',
	},
	dashboard: {
		origPasswordList: [],
		passwordList: []
	},
	filter: '',
}

export function appReducer (state = defaultState, action) {
	switch (action.type) {
		case 'loading':
			let status = action.status
			if (action.status === null) {
				status = state.loading ? false : true
			}

			return {...state, loading: status, statusText: action.text}

		case 'settings':
			let settings = {...state.settings, ...action.settings}
			API.init(settings)
			return {...state, settings}

		case 'login-container-size':
			return {...state, login: {...state.login, containerSize: action.size}}

		case 'orig-passwords':
			return {...state, dashboard: {...state.dashboard, origPasswordList: action.list}}

		case 'password-list':
			return {...state, dashboard: {...state.dashboard, passwordList: action.list}}

		case 'auth-flow':
			return {...state, authFlow: action.status}

		case 'touch-last-login':
			return {...state, lastLogin: action.timestamp}

		case 'set-last-login':
			return {...state, lastLogin: action.timestamp}

		case 'push-password':
			let origPasswordList = state.dashboard.origPasswordList.push(action.item)
			return {...state, dashboard: {...state.dashboard, origPasswordList: origPasswordList}}

		case 'push-route':
			return {...state, lastRoute: action.route}

		case 'set-password-filter':
			return {...state, filter: action.filter}

		default:
			return state;
	}
}

const storage = createSensitiveStorage({})

export const reducers = persistCombineReducers({ key: "root", storage}, { app: appReducer })

export default function configureStore () {
  let store = createStore(reducers,
  	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
  let persistor = persistStore(store)

  return { persistor, store }
}
