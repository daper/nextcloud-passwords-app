import React, { Component } from 'react'
import {
  StyleSheet,
  BackHandler,
  Dimensions,
} from 'react-native'
import {
  Container,
  Header,
  Left,
  Button,
  Icon,
  Body,
  Title,
  Footer,
  FooterTab,
  Text,
  Content,
  Form,
  Item,
  Label,
  Input,
  Textarea,
  CheckBox,
  View,
  Spinner,
} from 'native-base'
import {
  togglePasswordModal,
  setLoading,
} from './redux'
import { connect } from 'react-redux'
import { Colors, Passwords } from './API'
import GeneratePasswordModal from './GeneratePasswordModal'

export class AddSite extends Component {
  constructor (props) {
    super(props)

    this.state = {
      item: {
        folder: this.props.currentFolder,
        customFields: "[]"
      },
      showPassword: false,
      passwordIsError: false,
      labelIsError: false,
    }

    this.goBack = this.goBack.bind(this)
    this.updateHandler = this.updateHandler.bind(this)
    this.submit = this.submit.bind(this)
  }

  componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.goBack()
      return true
    })
  }

  componentWillUnmount () {
    this.backHandler.remove()
  }

  async goBack () {
    this.props.history.push('/dashboard')
  }

  updateHandler (name, value) {
    const item = this.state.item
    item[name] = value
    this.setState({ item })
  }

  validate () {
    let result = true
    if (this.state.item.password) {
      this.setState({ passwordIsError: false })
    } else {
      this.setState({ passwordIsError: true })
      result = false
    }

    if (this.state.item.label) {
      this.setState({ labelIsError: false })
    } else {
      this.setState({ labelIsError: true })
      result = false
    }

    return result
  }

  async submit () {
    if (this.validate()) {
      this.props.setLoading(true, 'Creating site...')
      const data = await Passwords.create(this.state.item)
      this.props.setLoading(false)

      if (!(data instanceof Error)) {
        this.props.history.push('/dashboard')
      }
    }
  }

  render () {
    return (
      <Container>
        {!this.props.loading && <Header style={{ backgroundColor: Colors.bgColor }}>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon type='MaterialIcons' name='arrow-back' />
            </Button>
          </Left>
          <Body>
            <Title>Create Site</Title>
          </Body>
        </Header>}
        <Content padder>
          {this.props.loading
            ? <View style={styles.spinnerView}>
              <Spinner style={styles.spinnerContent} color={Colors.bgColor} />
              <Text style={{ color: Colors.bgColor, marginTop: 20, ...styles.spinnerContent }}>{this.props.statusText}</Text>
            </View>
            : <Form>
              <Item stackedLabel last>
                <Label>Username</Label>
                <Input
                  value={this.state.item.username}
                  onChangeText={(filter) => this.updateHandler('username', filter)}
                />
              </Item>
              <Item stackedLabel last error={this.state.passwordIsError}>
                <Label>Password</Label>
                <Input
                  value={this.state.item.password}
                  secureTextEntry={!this.state.showPassword}
                  onChangeText={(filter) => this.updateHandler('password', filter)}
                />
                <Button transparent style={styles.copyPassButton}>
                  <Icon
                    active style={styles.showPassIcon}
                    type='MaterialIcons' name={this.state.showPassword ? 'visibility' : 'visibility-off'}
                    onPress={() => this.setState({ showPassword: !this.state.showPassword })}
                  />
                </Button>
                <Button
                  transparent style={styles.showPassButton}
                  onPress={() => this.props.togglePasswordModal(true)}
                >
                  <Icon active style={styles.showPassIcon} type='MaterialIcons' name='update' />
                </Button>
              </Item>
              <Item stackedLabel last error={this.state.labelIsError}>
                <Label>Name</Label>
                <Input
                  value={this.state.item.label}
                  onChangeText={(filter) => this.updateHandler('label', filter)}
                />
              </Item>
              <Item stackedLabel last>
                <Label>Website</Label>
                <Input
                  value={this.state.item.url}
                  onChangeText={(filter) => this.updateHandler('url', filter)}
                />
              </Item>
              <Item stackedLabel last>
                <Label>Notes</Label>
                <Textarea
                  rowSpan={5}
                  style={{ width: '100%' }}
                  defaultValue={this.state.item.notes}
                  value={this.state.item.notes}
                  onChangeText={(filter) => this.updateHandler('notes', filter)}
                />
              </Item>
              <Item last style={{ paddingTop: 10, paddingBottom: 10 }}>
                <CheckBox
                  checked={this.state.item.favorite}
                  onPress={() => this.updateHandler('favorite', !this.state.item.favorite)}
                />
                <Button
                  transparent full
                  style={{ justifyContent: 'flex-start', width: '80%', marginLeft: 30 }}
                  onPress={() => this.updateHandler('favorite', !this.state.item.favorite)}
                >
                  <Text uppercase={false} style={{ color: 'grey' }}>Favorite</Text>
                </Button>
              </Item>
            </Form>}
          {!this.props.loading && <GeneratePasswordModal onSelectPassword={(value) => { this.updateHandler('password', value) }} />}
        </Content>
        {!this.props.loading && <Footer>
          <FooterTab>
            <Button full success onPress={this.submit}>
              <Text style={{ color: 'white', fontSize: 16 }}>Create</Text>
            </Button>
          </FooterTab>
        </Footer>}
      </Container>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    passwordModalValue: state.app.passwordModalValue,
    loading: state.app.loading,
    statusText: state.app.statusText,
    currentFolder: state.app.currentFolder,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    togglePasswordModal: (...args) => { dispatch(togglePasswordModal.apply(ownProps, args)) },
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddSite)

const styles = StyleSheet.create({
  showPassButton: {
    alignSelf: 'center',
    marginTop: 25,
    right: 5,
    position: 'absolute',
  },
  showPassIcon: {
    fontSize: 20,
    color: 'grey',
  },
  copyPassButton: {
    alignSelf: 'center',
    marginTop: 25,
    right: 45,
    position: 'absolute',
  },
  spinnerView: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    height: Dimensions.get('screen').height - 128,
    display: 'flex'
  },
  spinnerContent: {
    flex: 1,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 25
  },
})
