import React, { Component } from 'react'
import { View } from 'react-native'
import { Root } from 'native-base'
import { NativeRouter, Route, Switch } from 'react-router-native'
import { connect } from 'react-redux'
import Login from './Login'
import Dashboard from './Dashboard'
import SingleView from './SingleView'
import AddSite from './AddSite'
import Favorites from './Favorites'
import Settings from './Settings'
import API, { Colors } from './API'

export class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      default: null
    }

    this.renderDefault = this.renderDefault.bind(this)

    API.init(this.props.settings)
    API.openDB()
  }

  async isLoggedIn () {
    return this.props.lastLogin !== 0
  }

  renderDefault ({ history }) {
    if (this.props.lastRoute !== '') {
      setTimeout(() => history.push(this.props.lastRoute), 0) // !!! FIX THIS
    } else {
      this.isLoggedIn().then((isLoggedIn) => {
        isLoggedIn
          ? history.push('/dashboard')
          : history.push('/login')
      })
    }

    return <View style={{ backgroundColor: Colors.bgColor }} />
  }

  render () {
    return (
      <Root>
        <NativeRouter>
          <Switch>
            <Route exact path='/' render={this.renderDefault} />
            <Route exact path='/login' component={Login} />
            <Route exact path='/dashboard' component={Dashboard} />
            <Route exact path='/view/:id' component={SingleView} />
            <Route exact path='/create' component={AddSite} />
            <Route exact path='/favorites' component={Favorites} />
            <Route exact path='/settings' component={Settings} />
          </Switch>
        </NativeRouter>
      </Root>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    lastRoute: state.app.lastRoute,
    settings: state.app.settings,
    lastLogin: state.app.lastLogin
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
