/** @format */

import { decode, encode } from 'base-64'

import React, { Component } from 'react'
import { AppRegistry, YellowBox } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import configureStore from './src/redux'

if (!global.btoa) {
    global.btoa = encode
}

if (!global.atob) {
    global.atob = decode
}

if (__DEV__) {
  console.disableYellowBox = true
  YellowBox.ignoreWarnings([
    'Remote debugger',
    'unknown call: "relay:check"'
  ])
}

export const { store, persistor } = configureStore()

class Application extends Component {
  render () {
    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    )
  }
}

AppRegistry.registerComponent(appName, () => Application)
