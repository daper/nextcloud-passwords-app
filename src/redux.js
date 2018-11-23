import { compose, applyMiddleware, createStore } from "redux"
import { Dimensions } from 'react-native'
import { persistStore, persistCombineReducers } from "redux-persist"
import createSensitiveStorage from "redux-persist-sensitive-storage"
import API from './API'

export const ActionTypes = {
  LOADING: 'LOADING',
  SETTINGS: 'SETTINGS',
  LOGIN_CONTAINER_SIZE: 'LOGIN_CONTAINER_SIZE',
  PUSH_PASSWORD: 'PUSH_PASSWORD',
  AUTH_FLOW: 'AUTH_FLOW',
  TOUCH_LAST_LOGIN: 'TOUCH_LAST_LOGIN',
  SET_LAST_LOGIN: 'SET_LAST_LOGIN',
  PUSH_ROUTE: 'PUSH_ROUTE',
  SET_PASSWORD_FILTER: 'SET_PASSWORD_FILTER',
  TOGGLE_PASSWORD_MODAL: 'TOGGLE_PASSWORD_MODAL',
  SET_PASSWORD_MODAL_VALUE: 'SET_PASSWORD_MODAL_VALUE',
  SET_CURRENT_FOLDER: 'SET_CURRENT_FOLDER',
}

// Actions
export function setLoading(status = null, text = 'Loading...') {
  return {
    type: ActionTypes.LOADING,
    status, text
  }
}

export function setSettings(settings) {
  return {
    type: ActionTypes.SETTINGS,
    settings
  }
}

export function setLoginContainerSize(size) {
  return {
    type: ActionTypes.LOGIN_CONTAINER_SIZE,
    size
  }
}

export function setAuthFlow(status) {
  return {
    type: ActionTypes.AUTH_FLOW,
    status
  }
}

export function touchLastLogin() {
  return {
    type: ActionTypes.TOUCH_LAST_LOGIN,
    timestamp: new Date().getTime()
  }
}

export function setLastLogin(ts) {
  return {
    type: ActionTypes.SET_LAST_LOGIN,
    timestamp: ts
  }
}

export function pushRoute(route) {
  return {
    type: ActionTypes.PUSH_ROUTE,
    route
  }
}

export function setPasswordFilter(filter) {
  return {
    type: ActionTypes.SET_PASSWORD_FILTER,
    filter
  }
}

export function togglePasswordModal(state) {
  return {
    type: ActionTypes.TOGGLE_PASSWORD_MODAL,
    state
  }
}

export function setPasswordModalValue(value) {
  return {
    type: ActionTypes.SET_PASSWORD_MODAL_VALUE,
    value
  }
}

export function setCurrentFolder(value) {
  return {
    type: ActionTypes.SET_CURRENT_FOLDER,
    value
  }
}

let defaultState = {
  loading: false,
  statusText: 'Contacting Server...',
  loginContainerSize: Dimensions.get('screen').height -25,
  authFlow: false,
  lastLogin: 0,
  lastRoute: '',
  settings: {
    server: '',
    user: '',
    password: '',
  },
  filter: '',
  passwordModalVisible: false,
  passwordModalValue: '',
  currentFolder: '00000000-0000-0000-0000-000000000000',
}

// Reducers
export function appReducer (state = defaultState, action) {
  switch (action.type) {
    case ActionTypes.LOADING:
      let status = action.status
      if (action.status === null) {
        status = state.loading ? false : true
      }

      return {...state, loading: status, statusText: action.text}

    case ActionTypes.SETTINGS:
      let settings = {...state.settings, ...action.settings}
      API.init(settings)
      return {...state, settings}

    case ActionTypes.LOGIN_CONTAINER_SIZE:
      return {...state, loginContainerSize: action.size}

    case ActionTypes.AUTH_FLOW:
      return {...state, authFlow: action.status}

    case ActionTypes.TOUCH_LAST_LOGIN:
      return {...state, lastLogin: action.timestamp}

    case ActionTypes.SET_LAST_LOGIN:
      return {...state, lastLogin: action.timestamp}

    case ActionTypes.PUSH_ROUTE:
      return {...state, lastRoute: action.route}

    case ActionTypes.SET_PASSWORD_FILTER:
      return {...state, filter: action.filter}

    case ActionTypes.TOGGLE_PASSWORD_MODAL:
      value = String(state.passwordModalValue)
      if (action.state === true) {
        value = ''
      }

      return {...state, passwordModalVisible: action.state, passwordModalValue: value}

    case ActionTypes.SET_PASSWORD_MODAL_VALUE:
      return {...state, passwordModalValue: action.value}

    case ActionTypes.SET_CURRENT_FOLDER:
      return {...state, currentFolder: action.value}

    default:
      return state;
  }
}

const storage = createSensitiveStorage({})

export const reducers = persistCombineReducers({ key: "root", storage}, { app: appReducer })

export default function configureStore () {
  let store = null
  if (__DEV__) {
    store = createStore(reducers,
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
  } else {
    store = createStore(reducers)
  }

  let persistor = persistStore(store)

  return { persistor, store }
}
