import React, { Component } from 'react'
import {
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Image,
} from 'react-native'
import {
  Container,
  Header,
  Content,
  Text,
  Body,
  Icon,
  Left,
  ListItem,
  Button,
  Right,
  ActionSheet,
  Picker,
  Input,
  Switch,
} from 'native-base'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-native'
import API, {
  Colors,
} from './API'
import {
  setLoading,
  setLastLogin,
  setSettings,
  setLockTimeout,
  setPasscode,
  toggleSecurity,
} from './redux'
import FooterMenu from './FooterMenu'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.nextcloudpasswords'
const PAYPAL_URL = 'https://paypal.me/daper'
const GITHUB_URL = 'https://github.com/daper/nextcloud-passwords-app/issues/new'

export class Settings extends Component {
  constructor (props) {
    super(props)

    this.forceSyncDown = this.forceSyncDown.bind(this)
    this.getLastLogin = this.getLastLogin.bind(this)
    this.logOut = this.logOut.bind(this)
    this.rateApp = this.rateApp.bind(this)
    this.shareApp = this.shareApp.bind(this)
    this.getSupport = this.getSupport.bind(this)
    this.setPasscode = this.setPasscode.bind(this)
    this.donate = this.donate.bind(this)
    this.toggleSecurity = this.toggleSecurity.bind(this)
    this.canEnableSecurity = this.canEnableSecurity.bind(this)
  }

  async componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.props.history.goBack()
      return true
    })
  }

  componentWillUnmount () {
    this.backHandler.remove()
  }

  getLastLogin () {
    let elapsed = new Date().getTime() - this.props.lastLogin
    let timeExpression = '00:00:00'

    let seconds = (elapsed / 1000).toFixed()
    let minutes; let hours; let days = 0
    if (seconds >= 60) {
      minutes = (seconds / 60).toFixed()
      seconds = (seconds % 60).toFixed()
      if (minutes >= 60) {
        hours = (minutes / 60).toFixed()
        minutes = (minutes % 60).toFixed()

        if (hours >= 24) {
          days = (hours / 24).toFixed()
          hours = (hours % 24).toFixed()

          timeExpression = `${days}d ${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`
        } else {
          timeExpression = `${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`
        }
      } else {
        timeExpression = `00:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`
      }
    } else {
      timeExpression = `00:00:${('0' + seconds).slice(-2)}`
    }

    return timeExpression
  }

  async forceSyncDown () {
    await this.props.setLastLogin(0)
    this.props.history.push('/dashboard')
  }

  async returnToLogin () {
    await API.dropDB()
    this.props.setLastLogin(0)
    this.props.setSettings({
      user: '',
      password: ''
    })

    this.props.history.push('/login')
  }

  logOut () {
    ActionSheet.show({
      options: ['Confirm', 'Cancel'],
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      title: 'Do you really want to log-out?'
    },
    (buttonIndex) => {
      if (buttonIndex === 0) {
        this.returnToLogin()
      }
    })
  }

  async rateApp () {
    if (Platform.OS === 'android') {
      let url = PLAY_URL

      let supported = await Linking.canOpenURL(url)
      if (supported) {
        Linking.openURL(url)
      }
    }
  }

  async getSupport () {
    let supported = await Linking.canOpenURL(GITHUB_URL)
    if (supported) {
      Linking.openURL(GITHUB_URL)
    }
  }

  async shareApp () {
    await Share.share({
      title: 'Nextcloud Passwords App',
      message: `Checkout this great app to manage you Nextcloud passwords on your mobile device. ${PLAY_URL}`
    }, {})
  }

  async donate () {
    let supported = await Linking.canOpenURL(PAYPAL_URL)
    if (supported) {
      Linking.openURL(PAYPAL_URL)
    }
  }

  async setPasscode (code) {
    if (!code.length || /^[0-9]{1,4}$/.test(code)) {
      await this.props.setPasscode(code)
    } else {
      await this.props.setPasscode(code.slice(0, 4))
    }

    if (this.props.passcode.length !== 4 && this.props.enableSecurity === true) {
      await this.props.toggleSecurity(false)
    }
  }

  async toggleSecurity (value = null) {
    if (typeof value !== 'boolean') {
      value = !this.props.enableSecurity
    }

    if (!this.canEnableSecurity()) {
      value = false
    }

    await this.props.toggleSecurity(value)
  }

  canEnableSecurity () {
    return this.props.passcode !== null &&
      this.props.passcode.length === 4
  }

  render () {
    return <Container>
      <Header style={{ backgroundColor: Colors.bgColor }}>
        <Body style={styles.headerBody}>
          <Icon type='MaterialIcons' name='settings' style={styles.headerBodyIcon} />
          <Text style={styles.headerBodyText}>Settings</Text>
        </Body>
      </Header>
      <Content padder contentContainerStyle={{ flexGrow: 1 }}>
        <ListItem itemDivider>
          <Text>Synchronization</Text>
        </ListItem>
        {/* <ListItem icon>
          <Left>
            <Button disabled style={{ backgroundColor: "grey" }}>
              <Icon active name="sync" />
            </Button>
          </Left>
          <Body>
            <Text>Automatic Syncing</Text>
          </Body>
          <Right>
            <Switch value={false} />
          </Right>
        </ListItem> */}
        <ListItem icon>
          <Left>
            <Button style={{ backgroundColor: 'grey' }}
              onPress={this.forceSyncDown}>
              <Icon active name='refresh' />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPess={this.forceSyncDown}>
              <Text>Force sync down</Text>
            </TouchableOpacity>
          </Body>
          <Right style={{ flexDirection: 'column' }}>
            <Text style={{ fontSize: 8 }}>Time elapsed:</Text>
            <Text style={{ paddingBottom: 4 }}>{this.getLastLogin()}</Text>
          </Right>
        </ListItem>
        <ListItem itemDivider>
          <Text>Security</Text>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button disabled style={{ backgroundColor: 'grey' }} onPress={this.toggleSecurity}>
              <Icon active type='MaterialIcons' name={this.props.enableSecurity ? 'lock' : 'lock-open'} />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.toggleSecurity}>
              <Text>Toggle security</Text>
            </TouchableOpacity>
          </Body>
          <Right>
            <Switch
              disabled={!this.canEnableSecurity()}
              value={this.props.enableSecurity}
              onValueChange={this.toggleSecurity} />
          </Right>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button style={{ backgroundColor: 'grey' }}>
              <Icon active type='MaterialIcons' name='vpn-key' />
            </Button>
          </Left>
          <Body>
            <Input secureTextEntry
              placeholder='Current passcode (not set)'
              keyboardType='numeric'
              defaultValue={this.props.passcode}
              value={this.props.passcode}
              onChangeText={this.setPasscode} />
          </Body>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button
              disabled={!this.canEnableSecurity()}
              style={{ backgroundColor: 'grey' }}>
              <Icon active type='MaterialIcons' name='timer' />
            </Button>
          </Left>
          <Body>
            <Picker
              enabled={this.canEnableSecurity()}
              mode='dropdown'
              iosIcon={<Icon name='ios-arrow-down-outline' />}
              placeholder='Lock Timeout'
              selectedValue={this.props.lockTimeout}
              onValueChange={this.props.setLockTimeout}
              style={{ marginRight: -10 }}
            >
              <Picker.Item label='Disabled' value={null} />
              <Picker.Item label='30 sec' value={30 * 1000} />
              <Picker.Item label='3 min' value={3 * 60 * 1000} />
              <Picker.Item label='10 min' value={10 * 60 * 1000} />
              <Picker.Item label='30 min' value={30 * 60 * 1000} />
            </Picker>
          </Body>
        </ListItem>
        <ListItem itemDivider>
          <Text>Support</Text>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button onPress={this.donate}>
              <Image
                source={require('../assets/pint-of-beer.png')}
                style={{
                  width: 29,
                  height: 29,
                  borderRadius: 6,
                  marginTop: 2,
                }} />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.donate}>
              <Text>Buy me a pint</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button warning
              onPress={this.rateApp}>
              <Icon active name='star' />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.rateApp}>
              <Text>Rate this app</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button style={{ backgroundColor: 'grey' }}
              onPress={this.shareApp}>
              <Icon active name='share' />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.shareApp}>
              <Text>Share this app</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button style={{ backgroundColor: 'grey' }}
              onPress={this.getSupport}>
              <Icon active name='md-help' />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.getSupport}>
              <Text>Report a problem</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
        <ListItem itemDivider>
          <Text>Disconnection</Text>
        </ListItem>
        <ListItem icon>
          <Left>
            <Button style={{ backgroundColor: '#d9534f' }}
              onPress={this.logOut}>
              <Icon active name='md-power' />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={this.logOut}>
              <Text>Log out</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
      </Content>
      <FooterMenu />
    </Container>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    lastLogin: state.app.lastLogin,
    lockTimeout: state.app.lockTimeout,
    passcode: state.app.passcode,
    enableSecurity: state.app.enableSecurity,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    setLastLogin: (...args) => { dispatch(setLastLogin.apply(ownProps, args)) },
    setSettings: (...args) => { dispatch(setSettings.apply(ownProps, args)) },
    setLockTimeout: (...args) => { dispatch(setLockTimeout.apply(ownProps, args)) },
    setPasscode: (...args) => { dispatch(setPasscode.apply(ownProps, args)) },
    toggleSecurity: (...args) => { dispatch(toggleSecurity.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Settings))

const styles = StyleSheet.create({
  headerBody: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  headerBodyIcon: {
    color: 'white',
    alignSelf: 'center',
    paddingLeft: 10,
  },
  headerBodyText: {
    color: 'white',
    flexGrow: 1,
    fontSize: 20,
    alignSelf: 'center',
    paddingLeft: 20,
  }
})
