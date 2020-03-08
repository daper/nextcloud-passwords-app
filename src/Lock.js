import React, { Component } from 'react'
import {
  StyleSheet,
} from 'react-native'
import {
  Icon,
  Text,
  Container,
  Content,
  View,
  Button,
  Input,
  Item,
} from 'native-base'
import { Colors } from './API'
import { withRouter } from 'react-router-native'
import { connect } from 'react-redux'
import {
  setLocked,
} from './redux'
import FingerprintScanner from 'react-native-fingerprint-scanner'

class Lock extends Component {
  constructor (props) {
    super(props)

    this.getFingerprintStyles = this.getFingerprintStyles.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
    this.setError = this.setError.bind(this)
    this.numberPressed = this.numberPressed.bind(this)
    this.backspacePressed = this.backspacePressed.bind(this)
    this.backspacePressedLong = this.backspacePressedLong.bind(this)
    this.goBack = this.goBack.bind(this)

    this.state = {
      isError: null,
      fallback: true,
      passcode: '',
      sensorAvail: true
    }
  }

  async componentDidMount () {
    if (!this.props.isLocked) {
      this.props.history.push('/dashboard')
      return
    }

    try {
      let isAvailable = await FingerprintScanner.isSensorAvailable()
      if (!isAvailable) {
        this.setState({ sensorAvail: isAvailable })
      } else {
        await FingerprintScanner.authenticate({ description: 'Unlock', onAttempt: this.setError })
        await this.setState({ isError: false })

        setTimeout(this.goBack, 400)
      }
    } catch (err) {
      this.setError(err)
    }
  }

  async componentWillUnmount () {
    try {
      await FingerprintScanner.release()
    } catch (err) { /* Do nothing */ }
  }

  async setError (err) {
    if (__DEV__) console.log(err.name, err)
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout)
    }

    switch (err.name) {
      case 'DeviceLocked':
        await this.setState({ isError: true, errorMessage: err.message })
        this.errorTimeout = setTimeout(() => {
          this.setState({ isError: null, errorMessage: null })
        }, 30000)
        break
      default:
        await this.setState({ isError: true, errorMessage: err.message })
        this.errorTimeout = setTimeout(() => {
          this.setState({ isError: null, errorMessage: null })
        }, 300)
        break
    }
  }

  async numberPressed (number) {
    if (this.state.passcode.length < 4) {
      await this.setState({ passcode: `${this.state.passcode}${number}` })
    }

    if (this.state.passcode === this.props.passcode) {
      await this.setState({ isError: false })
      setTimeout(this.goBack, 300)
    }
  }

  backspacePressed () {
    this.setState({ passcode: this.state.passcode.substr(0, this.state.passcode.length - 1) })
  }

  backspacePressedLong () {
    this.setState({ passcode: '' })
  }

  getFingerprintStyles () {
    switch (this.state.isError) {
      case null:
        return { ...styles.fingerprintIcon, ...styles.fingerprintIconDefault }
      case true:
        return { ...styles.fingerprintIcon, ...styles.fingerprintIconDanger }
      case false:
        return { ...styles.fingerprintIcon, ...styles.fingerprintIconSuccess }
    }
  }

  async goBack () {
    await this.props.setLocked(false)
    if (this.props.history.canGo(-1)) {
      this.props.history.goBack()
    } else {
      this.props.history.push('/dashboard')
    }
  }

  render () {
    return <Container style={{ backgroundColor: 'white' }}>
      <Content contentContainerStyle={styles.container} padder>
        <View style={styles.numbersContainer}>
          <View style={{ alignItems: 'center', marginTop: 25 }}>
            <Icon type='MaterialIcons' name={this.state.sensorAvail ? 'fingerprint' : (this.state.isError === false ? 'lock-open' : 'lock')}
              style={this.getFingerprintStyles()} />
            <View style={{ width: '80%' }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>
                {this.state.isError
                  ? this.state.errorMessage
                  : (this.state.sensorAvail
                    ? 'Scan your fingerprint on the\ndevice scanner to continue'
                    : 'Type your passcode to continue')}
              </Text>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Item last style={{ width: '80%' }}>
              <Input
                secureTextEntry
                disabled
                value={this.state.passcode}
                style={styles.inputField} />
            </Item>
            <Button transparent style={styles.backspaceIcon}
              onPress={this.backspacePressed}
              onLongPress={this.backspacePressedLong}>
              <Icon type='MaterialIcons' name='backspace' style={{ color: 'white' }} />
            </Button>
          </View>
          <View style={styles.numbersRowContainer}>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(1) }}>
              <Text style={styles.numberText}>1</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(2) }}>
              <Text style={styles.numberText}>2</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(3) }}>
              <Text style={styles.numberText}>3</Text>
            </Button>
          </View>
          <View style={styles.numbersRowContainer}>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(4) }}>
              <Text style={styles.numberText}>4</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(5) }}>
              <Text style={styles.numberText}>5</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(6) }}>
              <Text style={styles.numberText}>6</Text>
            </Button>
          </View>
          <View style={styles.numbersRowContainer}>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(7) }}>
              <Text style={styles.numberText}>7</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(8) }}>
              <Text style={styles.numberText}>8</Text>
            </Button>
            <Button style={styles.number}
              onPress={() => { this.numberPressed(9) }}>
              <Text style={styles.numberText}>9</Text>
            </Button>
          </View>
          <View style={styles.numbersRowContainer}>
            <Button disabled style={styles.number} />
            <Button style={styles.number}
              onPress={() => { this.numberPressed(0) }}>
              <Text style={styles.numberText}>0</Text>
            </Button>
            <Button disabled style={styles.number} />
          </View>
        </View>
      </Content>
    </Container>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    isLocked: state.app.isLocked,
    passcode: state.app.passcode,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLocked: (...args) => { dispatch(setLocked.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Lock))

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
  },
  fingerprintIcon: {
    color: 'white',
    fontSize: 100,
    marginBottom: 30,
    padding: 30,
    borderRadius: 80,
  },
  fingerprintIconDefault: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fingerprintIconDanger: {
    backgroundColor: 'rgba(217, 83, 79, 0.6)',
  },
  fingerprintIconSuccess: {
    backgroundColor: 'rgba(92, 184, 92, 0.6)',
  },
  numbersContainer: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  numbersRowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
  },
  number: {
    flexGrow: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  numberText: {
    fontSize: 26,
    color: 'white',
  },
  inputContainer: {
    flexGrow: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  inputField: {
    color: 'white',
    textAlign: 'center',
    fontSize: 28,
  },
  backspaceIcon: {
    alignSelf: 'center',
    right: 25,
    position: 'absolute',
  },
})
