import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Keyboard,
  Linking
} from 'react-native'
import { WebView } from 'react-native-webview'
import Svg, { Path } from 'react-native-svg'
import { Form, Item, Label, Input, Button, Spinner } from 'native-base'
import API, { Colors } from './API'
import { withRouter, Redirect } from 'react-router-native'
import { connect } from 'react-redux'
import {
  setLoading,
  setLoginUri,
  setSettings,
  setAuthFlow,
  touchLastLogin,
  setLocked,
  setPasscode,
  setLockTimeout,
} from './redux'

export const logoPath = 'm67.0328,9.99997c-11.80525,0 -21.81118,8.00318 -24.91235,18.84659c-2.69524,-5.75151 -8.53592,-9.78093 -15.26337,-9.78093c-9.25183,0 -16.85708,7.60525 -16.85708,16.85708c0,9.25182 7.60525,16.86054 16.85708,16.86054c6.72745,0 12.56813,-4.03188 15.26337,-9.78439c3.10117,10.84422 13.1071,18.85006 24.91235,18.85006c11.71795,0 21.67286,-7.8851 24.85334,-18.60701c2.74505,5.62192 8.51344,9.54134 15.14533,9.54134c9.25183,0 16.86055,-7.60872 16.86055,-16.86054c0,-9.25183 -7.60872,-16.85708 -16.86055,-16.85708c-6.63189,0 -12.40028,3.91696 -15.14533,9.53788c-3.18048,-10.72108 -13.13539,-18.60354 -24.85334,-18.60354zm0,9.8955c8.91163,0 16.03073,7.11564 16.03073,16.02724c0,8.9116 -7.1191,16.03071 -16.03073,16.03071c-8.91158,0 -16.02722,-7.11911 -16.02722,-16.03071c0,-8.9116 7.11564,-16.02724 16.02722,-16.02724zm-40.17572,9.06567c3.90437,0 6.96504,3.05718 6.96504,6.96157c0,3.90438 -3.06067,6.96504 -6.96504,6.96504c-3.90439,0 -6.96158,-3.06066 -6.96158,-6.96504c0,-3.90439 3.05719,-6.96157 6.96158,-6.96157zm80.17439,0c3.9044,0 6.96504,3.05718 6.96504,6.96157c0,3.90438 -3.06066,6.96504 -6.96504,6.96504c-3.90437,0 -6.96156,-3.06066 -6.96156,-6.96504c0,-3.90439 3.05721,-6.96157 6.96156,-6.96157z'

class Login extends Component {
  constructor (props) {
    super(props)
    this.state = {
      containerSize: Dimensions.get('screen').height - 25,
    }

    this.updateContainerSize = this.updateContainerSize.bind(this)
    this.keyboardDidShow = this.keyboardDidShow.bind(this)
    this.keyboardDidHide = this.keyboardDidHide.bind(this)
    this.validateServer = this.validateServer.bind(this)
    this._handleOpenURL = this._handleOpenURL.bind(this)

    // Reset security settings
    // I don't like this place to do this... :/
    this.props.setLocked(false)
    this.props.setPasscode('')
    this.props.setLockTimeout(Infinity)
  }

  updateContainerSize ({ screen }) {
    this.setState({
      containerSize: screen.height - 25
    })
  }

  keyboardDidShow (e) {
    this.setState({
      containerSize: Dimensions.get('window').height - e.endCoordinates.height - 25
    })
  }

  keyboardDidHide (e) {
    this.setState({
      containerSize: Dimensions.get('window').height
    })
  }

  componentDidMount () {
    Dimensions.addEventListener('change', this.updateContainerSize)
    Keyboard.addListener('keyboardDidShow', this.keyboardDidShow)
    Keyboard.addListener('keyboardDidHide', this.keyboardDidHide)
    Linking.addEventListener('url', this._handleOpenURL)

    if (this.props.settings.user !== '' && this.props.settings.password !== '') {
      this.props.history.push('/dashboard')
    }
  }

  componentWillUnmount () {
    Dimensions.removeEventListener('change', this.updateContainerSize)
    Keyboard.removeListener('keyboardDidShow', this.keyboardDidShow)
    Keyboard.removeListener('keyboardDidHide', this.keyboardDidHide)
    Linking.removeEventListener('url', this._handleOpenURL)
  }

  async validateServer () {
    this.props.setLoading(true)

    if (!/^https:\/\//.test(this.props.settings.server)) {
      await this.props.setSettings({ ...this.props.settings, server: `https://${this.props.settings.server}` })
    }

    if (/^http:\/\//.test(this.props.settings.server)) {
      let server = this.props.settings.server.replace('http://', '')
      await this.props.setSettings({ ...this.props.settings, server: `https://${server}` })
    }

    API.init(this.props.settings)
    let { error, data } = await API.validateServer()
    if (error) {
      this.props.setLoading(true, error.message)
      this.props.setSettings({ ...this.props.settings, server: '' })

      setTimeout(() => {
        this.props.setLoading(false, 'Contacting Server...')
      }, 1000)
    } else {
      let name = data.ocs.data.capabilities.theming.name
      let version = data.ocs.data.version.string
      this.props.setLoading(true, `${name} ${version}`)
      this.props.setAuthFlow(true)
    }
  }

  _handleOpenURL ({ url }) {
    if (/^nc:\/\/login/.test(url)) {
      this.WebView.stopLoading()
      if (__DEV__) console.log('Got Nextcloud Access!')
      this.props.setAuthFlow(false)

      let matches = url.match(/(server|user|password):([^&]+)/g)
      if (matches) {
        let settings = {}
        matches.forEach((match) => {
          let key = match.split(':')[0]
          let value = match.split(':').slice(1).join(':')
          settings[key] = value
        })

        this.props.setSettings(settings)
        this.props.setLoading(true, 'Success! Opening...')

        API.init(settings)
        API.openDB()
          .then(() => this.props.history.push('/dashboard'))
      }

      return false
    } else {
      return true
    }
  }

  _renderForm () {
    if (this.props.lastLogin !== 0) {
      return <Redirect to='/dashboard' />
    } else if (!this.props.loading) {
      return (<Form style={styles.formContainer}>
        <Item stackedLabel style={{ marginTop: 20, marginLeft: 3 }}>
          <Label style={styles.formLabel}>Server address https://...</Label>
          <Input style={{ color: 'white' }}
            onChangeText={(text) => {
              this.props.setSettings({ ...this.props.settings, server: text })
            }}
            onSubmitEditing={this.validateServer}
          >
            {this.props.settings.server}
          </Input>
        </Item>
        <View style={{ marginTop: 20 }}>
          <Button full bordered style={{ borderColor: 'white' }} onPress={this.validateServer}>
            <Text style={{ color: 'white' }}>Continue</Text>
          </Button>
        </View>
      </Form>)
    } else {
      return (<View>
        <Spinner color='white' />
        <Text style={{ color: 'white' }}>{this.props.statusText}</Text>
      </View>)
    }
  }

  render () {
    if (this.props.authFlow) {
      let src = {
        uri: `${this.props.settings.server}/index.php/login/flow`,
        headers: {
          'OCS-APIRequest': 'true',
          'User-Agent': 'Nextcloud Passwords for Android'
        }
      }
      return (
        <WebView
          originWhitelist={['*']}
          ref={c => { this.WebView = c }}
          source={src}
          style={styles.webview}
          ignoreSslError
          javaScriptEnabled
          automaticallyAdjustContentInsets
          onError={(err) => { if (__DEV__) console.log('onError', err) }}
          renderError={(err) => { if (__DEV__) console.log('renderError', err) }}
          onShouldStartLoadWithRequest={this._handleOpenURL}
          onNavigationStateChange={this._handleOpenURL}
          cacheEnabled={false}
        />
      )
    } else {
      return (
        <ScrollView style={{ backgroundColor: Colors.bgColor }}>
          <View style={{ height: this.state.containerSize, ...styles.container }}>
            <Svg width={135 * 2} height={75 * 2} viewBox='0 0 135 75'>
              <Path fill='white' d={logoPath} />
            </Svg>
            {this._renderForm()}
          </View>
        </ScrollView>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.app.loading,
    statusText: state.app.statusText,
    settings: state.app.settings,
    authFlow: state.app.authFlow,
    lastLogin: state.app.lastLogin,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    setLoginUri: (...args) => { dispatch(setLoginUri.apply(ownProps, args)) },
    setSettings: (...args) => { dispatch(setSettings.apply(ownProps, args)) },
    setAuthFlow: (...args) => { dispatch(setAuthFlow.apply(ownProps, args)) },
    touchLastLogin: (...args) => { dispatch(touchLastLogin.apply(ownProps, args)) },
    setLocked: (...args) => { dispatch(setLocked.apply(ownProps, args)) },
    setPasscode: (...args) => { dispatch(setPasscode.apply(ownProps, args)) },
    setLockTimeout: (...args) => { dispatch(setLockTimeout.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login))

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgColor
  },
  formContainer: {
    width: '85%',
    marginTop: 10
  },
  formLabel: {
    color: 'white',
    marginTop: -5
  },
  webview: {
    backgroundColor: Colors.bgColor,
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
    minHeight: Dimensions.get('screen').height,
  }
})
