/** @format */

import React, { Component } from 'react'
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'
import configureStore from './redux';
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Remote debugger']);

export const {store, persistor} = configureStore()

class Application extends Component {
  render() {
    return (
      <Provider store={store}>
      	<PersistGate persistor={persistor}>
        	<App />
    	</PersistGate>
      </Provider>
    );
  }
}

AppRegistry.registerComponent(appName, () => Application);
