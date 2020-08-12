import React, { Component } from 'react'
import {
  StyleSheet,
  Modal,
} from 'react-native'
import Slider from '@react-native-community/slider'
import {
  View,
  Header,
  Body,
  Title,
  Right,
  Spinner,
  Content,
  Button,
  Footer,
  FooterTab,
  Icon,
  Item,
  Input,
  Text,
  CheckBox,
} from 'native-base'
import { connect } from 'react-redux'
import { Colors, Passwords } from './API'
import { togglePasswordModal, setPasswordModalValue } from './redux'

export class GeneratePasswordModal extends Component {
  constructor (props) {
    super(props)

    this.handleRequestNewPassword = this.handleRequestNewPassword.bind(this)
    this.handleCloseModal = this.handleCloseModal.bind(this)
    this.handleUsePassword = this.handleUsePassword.bind(this)
    this.handleUpdatePassword = this.handleUpdatePassword.bind(this)

    this.state = {
      requestingNewPassword: false,
      enableNumbers: true,
      enableSpecial: true,
      strength: 2
    }
  }

  async handleRequestNewPassword () {
    this.setState({ requestingNewPassword: true })

    const data = await Passwords.generateDefaultPassword({
      numbers: this.state.enableNumbers,
      special: this.state.enableSpecial,
      strength: this.state.strength,
    })

    this.setState({
      requestingNewPassword: false,
      enableNumbers: data.numbers,
      enableSpecial: data.special,
      strength: data.strength,
    })

    this.props.setPasswordModalValue(data.password)
  }

  handleCloseModal () {
    this.props.togglePasswordModal(false)
  }

  handleUsePassword () {
    this.handleCloseModal()
    if (this.props.passwordModalValue !== '') {
      this.props.onSelectPassword(this.props.passwordModalValue)
    }
  }

  handleUpdatePassword (value) {
    this.props.setPasswordModalValue(value)
  }

  render () {
    return <Modal
      animationType='none'
      transparent
      visible={this.props.passwordModalVisible}
      onRequestClose={this.handleCloseModal}
           >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Header style={{ backgroundColor: Colors.bgColor }}>
            <Body>
              <Title style={{ fontSize: 16 }}>Generate Password</Title>
            </Body>
            <Right>
              <Button block transparent onPress={this.handleCloseModal}>
                <Icon type='MaterialIcons' name='close' />
              </Button>
            </Right>
          </Header>
          <Content padder style={styles.modalContentContent}>
            <Item>
              <Input
                placeholder='password'
                value={this.props.passwordModalValue}
                onChangeText={this.handleUpdatePassword}
              />
              {!this.state.requestingNewPassword
                ? <Button transparent onPress={this.handleRequestNewPassword}>
                  <Icon type='MaterialIcons' active name='sync' style={{ fontSize: 40, color: 'grey' }} />
                </Button>
                : <Spinner style={{ height: 10 }} color={Colors.bgColor} />}
            </Item>
            <Item>
              <CheckBox
                checked={this.state.enableNumbers}
                onPress={() => this.setState({ enableNumbers: !this.state.enableNumbers })}
              />
              <Button
                transparent full
                onPress={() => this.setState({ enableNumbers: !this.state.enableNumbers })}
              >
                <Text uppercase={false} style={{ marginLeft: 30, color: 'grey' }}>Enable numbers</Text>
              </Button>
            </Item>
            <Item>
              <CheckBox
                checked={this.state.enableSpecial}
                onPress={() => this.setState({ enableSpecial: !this.state.enableSpecial })}
              />
              <Button
                transparent full
                onPress={() => this.setState({ enableSpecial: !this.state.enableSpecial })}
              >
                <Text uppercase={false} style={{ marginLeft: 30, color: 'grey' }}>Enable special</Text>
              </Button>
            </Item>
            <Item style={{ height: 50 }}>
              <Text style={{ width: '10%', marginLeft: 10 }}>{this.state.strength}</Text>
              <Slider
                step={1}
                maximumValue={10}
                minimumValue={1}
                onValueChange={(value) => { this.setState({ strength: value }) }}
                value={this.state.strength}
                style={{ width: '80%' }}
                thumbTintColor={Colors.bgColor}
                minimumTrackTintColor={Colors.bgColor}
              />
            </Item>
          </Content>
          <Footer>
            <FooterTab>
              <Button full success style={styles.modalFooterStyle} onPress={this.handleUsePassword}>
                <Text style={{ color: 'white', fontSize: 14 }}>Use</Text>
              </Button>
            </FooterTab>
          </Footer>
        </View>
      </View>
    </Modal>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    passwordModalVisible: state.app.passwordModalVisible,
    passwordModalValue: state.app.passwordModalValue,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    togglePasswordModal: (...args) => { dispatch(togglePasswordModal.apply(ownProps, args)) },
    setPasswordModalValue: (...args) => { dispatch(setPasswordModalValue.apply(ownProps, args)) },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GeneratePasswordModal)

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    height: 350,
  },
  modalContentContent: {
    backgroundColor: 'white',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.bgColor,
  },
  modalFooterStyle: {
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.bgColor,
  },
})
