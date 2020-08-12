import { createStore } from 'redux'
import { Dimensions } from 'react-native'
import { persistStore, persistCombineReducers } from 'redux-persist'
import createSensitiveStorage from 'redux-persist-sensitive-storage'
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
  SET_FINGERPRINT_AVAILABLE: 'SET_FINGERPRINT_AVAILABLE',
  SET_LOCKED: 'SET_LOCKED',
  SET_PASSCODE: 'SET_PASSCODE',
  SET_LOCK_TIMEOUT: 'SET_LOCK_TIMEOUT',
  SET_LAST_FOREGROUND: 'SET_LAST_FOREGROUND',
  TOGGLE_SECURITY: 'TOGGLE_SECURITY',
}

// Actions
export function setLoading (status = null, text = 'Loading...') {
  return {
    type: ActionTypes.LOADING,
    status,
    text
  }
}

export function setSettings (settings) {
  return {
    type: ActionTypes.SETTINGS,
    settings
  }
}

export function setLoginContainerSize (size) {
  return {
    type: ActionTypes.LOGIN_CONTAINER_SIZE,
    size
  }
}

export function setAuthFlow (status) {
  return {
    type: ActionTypes.AUTH_FLOW,
    status
  }
}

export function touchLastLogin () {
  return {
    type: ActionTypes.TOUCH_LAST_LOGIN,
    timestamp: new Date().getTime()
  }
}

export function setLastLogin (ts) {
  return {
    type: ActionTypes.SET_LAST_LOGIN,
    timestamp: ts
  }
}

export function setPasswordFilter (filter) {
  return {
    type: ActionTypes.SET_PASSWORD_FILTER,
    filter
  }
}

export function togglePasswordModal (state) {
  return {
    type: ActionTypes.TOGGLE_PASSWORD_MODAL,
    state
  }
}

export function setPasswordModalValue (value) {
  return {
    type: ActionTypes.SET_PASSWORD_MODAL_VALUE,
    value
  }
}

export function setCurrentFolder (value) {
  return {
    type: ActionTypes.SET_CURRENT_FOLDER,
    value
  }
}

export function setFingerprintAvailability (value) {
  return {
    type: ActionTypes.SET_FINGERPRINT_AVAILABLE,
    value: Boolean(value)
  }
}

export function setLocked (value) {
  return {
    type: ActionTypes.SET_LOCKED,
    value: Boolean(value)
  }
}

export function setPasscode (code) {
  return {
    type: ActionTypes.SET_PASSCODE,
    value: code || ''
  }
}

export function setLockTimeout (time) {
  return {
    type: ActionTypes.SET_LOCK_TIMEOUT,
    value: time
  }
}

export function setLastForeground (time) {
  return {
    type: ActionTypes.SET_LAST_FOREGROUND,
    value: time
  }
}

export function toggleSecurity (value) {
  return {
    type: ActionTypes.TOGGLE_SECURITY,
    value: Boolean(value)
  }
}

const defaultState = {
  loading: false,
  statusText: 'Contacting Server...',
  loginContainerSize: Dimensions.get('screen').height - 25,
  authFlow: false,
  lastLogin: 0,
  settings: {
    server: '',
    user: '',
    password: '',
    dbName: 'nextcloud.db',
  },
  filter: '',
  passwordModalVisible: false,
  passwordModalValue: '',
  currentFolder: '00000000-0000-0000-0000-000000000000',
  isFingerPrintAvailable: false,
  isLocked: false,
  passcode: '',
  lockTimeout: Infinity,
  lastForeground: '',
  enableSecurity: false,
}

// Reducers
export function appReducer (state = defaultState, action) {
  switch (action.type) {
    case ActionTypes.LOADING: {
      let status = action.status
      if (action.status === null) {
        status = !state.loading
      }

      return { ...state, loading: status, statusText: action.text }
    }
    case ActionTypes.SETTINGS: {
      const settings = { ...state.settings, ...action.settings }
      API.init(settings)
      return { ...state, settings }
    }
    case ActionTypes.LOGIN_CONTAINER_SIZE:
      return { ...state, loginContainerSize: action.size }

    case ActionTypes.AUTH_FLOW:
      return { ...state, authFlow: action.status }

    case ActionTypes.TOUCH_LAST_LOGIN:
      return { ...state, lastLogin: action.timestamp }

    case ActionTypes.SET_LAST_LOGIN:
      return { ...state, lastLogin: action.timestamp }

    case ActionTypes.SET_PASSWORD_FILTER:
      return { ...state, filter: action.filter }

    case ActionTypes.TOGGLE_PASSWORD_MODAL: {
      let value = String(state.passwordModalValue)
      if (action.state === true) {
        value = ''
      }

      return { ...state, passwordModalVisible: action.state, passwordModalValue: value }
    }
    case ActionTypes.SET_PASSWORD_MODAL_VALUE:
      return { ...state, passwordModalValue: action.value }

    case ActionTypes.SET_CURRENT_FOLDER:
      return { ...state, currentFolder: action.value }

    case ActionTypes.SET_FINGERPRINT_AVAILABLE:
      return { ...state, isFingerPrintAvailable: action.value }

    case ActionTypes.SET_LOCKED:
      return { ...state, isLocked: action.value }

    case ActionTypes.SET_PASSCODE:
      return { ...state, passcode: action.value }

    case ActionTypes.SET_LOCK_TIMEOUT:
      return { ...state, lockTimeout: action.value }

    case ActionTypes.SET_LAST_FOREGROUND:
      return { ...state, lastForeground: action.value }

    case ActionTypes.TOGGLE_SECURITY:
      return { ...state, enableSecurity: action.value }

    default:
      return state
  }
}

const storage = createSensitiveStorage({
  touchID: false,
  showModal: true
})

export const reducers = persistCombineReducers({ key: 'root', storage }, { app: appReducer })

export default function configureStore () {
  let store = null
  if (__DEV__) {
    store = createStore(reducers,
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
  } else {
    store = createStore(reducers)
  }

  const persistor = persistStore(store)

  return { persistor, store }
}
