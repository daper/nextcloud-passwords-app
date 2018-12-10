import React, { Component } from 'react'
import { AppState } from 'react-native'
import { Root } from 'native-base'
import { NativeRouter, Route, Switch, Redirect } from 'react-router-native'
import { connect } from 'react-redux'
import Login from './Login'
import Dashboard from './Dashboard'
import SingleView from './SingleView'
import AddSite from './AddSite'
import Favorites from './Favorites'
import Settings from './Settings'
import Lock from './Lock'
import API from './API'
import { setLocked } from './redux'

export class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      default: null,
      appState: AppState.currentState,
      lastForeground: 0,
    }

    this.renderDefault = this.renderDefault.bind(this)
    this.renderComponent = this.renderComponent.bind(this)
    this._handleAppStateChange = this._handleAppStateChange.bind(this)

    API.init(this.props.settings)
    API.openDB()
  }

  componentDidMount () {
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  async _handleAppStateChange (nextAppState) {
    if (this.props.lockTimeout === null || this.props.isLocked) { return }

    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      let elapsed = new Date().getTime() - this.state.lastForeground
      if (elapsed > this.props.lockTimeout) {
        await this.props.setLocked(true)
      }
    } else { // App went to background
      await this.setState({ lastForeground: new Date().getTime() })
    }

    await this.setState({ appState: nextAppState })
  }

  isLoggedIn () {
    return this.props.lastLogin !== 0
  }

  renderDefault () {
    return this.isLoggedIn()
      ? <Redirect to='/dashboard' />
      : <Redirect to='/login' />
  }

  renderComponent ({ component: Component, ...rest }) {
    if (this.props.isLocked) {
      return <Route {...rest} render={(props) => <Redirect push to='/lock' />} />
    } else {
      return <Route {...rest} render={(props) => <Component {...props} />} />
    }
  }

  render () {
    return (
      <Root>
        <NativeRouter>
          <Switch>
            <Route exact path='/' render={this.renderDefault} />
            <Route exact path='/login' component={Login} />
            <this.renderComponent exact path='/dashboard' component={Dashboard} />
            <this.renderComponent exact path='/view/:id' component={SingleView} />
            <this.renderComponent exact path='/create' component={AddSite} />
            <this.renderComponent exact path='/favorites' component={Favorites} />
            <this.renderComponent exact path='/settings' component={Settings} />
            <Route exact path='/lock' component={Lock} />
          </Switch>
        </NativeRouter>
      </Root>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    settings: state.app.settings,
    lastLogin: state.app.lastLogin,
    lockTimeout: state.app.lockTimeout,
    isLocked: state.app.isLocked,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLocked: (...args) => { dispatch(setLocked.apply(ownProps, args)) },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
