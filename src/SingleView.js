import React, { Component } from 'react'
import {
  StyleSheet,
  BackHandler,
  Dimensions,
  Clipboard,
} from 'react-native'
import { withRouter } from 'react-router-native'
import {
  Container,
  Header,
  Body,
  Title,
  Subtitle,
  Content,
  Text,
  Icon,
  Item,
  Input,
  Button,
  Left,
  Form,
  Label,
  View,
  Spinner,
  Textarea,
  Right,
  Toast,
  ActionSheet,
} from 'native-base'
import { connect } from 'react-redux'
import { Colors, Passwords } from './API'
import { setLoading, togglePasswordModal } from './redux'
import GeneratePasswordModal from './GeneratePasswordModal'

export class SingleView extends Component {
  constructor (props) {
    super(props)

    this.updateHandler = this.updateHandler.bind(this)
    this.stopEditing = this.stopEditing.bind(this)
    this.startEditing = this.startEditing.bind(this)
    this.setFavorite = this.setFavorite.bind(this)
    this.goBack = this.goBack.bind(this)
    this.delete = this.delete.bind(this)
    this.save = this.save.bind(this)

    this.state = {
      untouchedItem: {},
      item: {},
      showPassword: false,
      editing: false,
      notes: '',
      showPasswordModal: false,
      favoriteUpdating: false,
    }

    let { match } = props
    if (__DEV__) console.log(`Showing ${match.params.id}`)
  }

  async componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.goBack()
      return true
    })

    let { id } = this.props.match.params

    this.props.setLoading(true, 'Loading site...')

    let item = await Passwords.getItem(id)
    if (__DEV__) console.log(item)

    item.notes = String(item.notes)
    item.url = String(item.url)
    item.password = String(item.password)
    item.username = String(item.username)

    this.setState({ item, untouchedItem: { ...item } })

    this.props.setLoading(false)
  }

  componentWillUnmount () {
    this.backHandler.remove()
  }

  async save () {
    try {
      this.props.setLoading(true, 'Saving...')
      let { id, label, username, password, url, notes } = this.state.item
      await Passwords.updateItem({ id, label, username, password, url, notes })
    } catch (err) {
      if (__DEV__) console.log('save', err)
    }
    this.props.setLoading(false)
  }

  delete () {
    ActionSheet.show({
      options: ['Delete', 'Cancel'],
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      title: 'Do you really want to delete this entry?'
    },
    (buttonIndex) => {
      if (buttonIndex === 0) {
        Passwords.deleteItem(this.state.item.id)
          .then(() => this.goBack())
          .catch((err) => {
            if (__DEV__) console.log('err', err)
          })
      }
    })
  }

  updateHandler (name, value) {
    let item = this.state.item
    item[name] = value
    this.setState({ item })
  }

  async goBack () {
    this.props.history.goBack()
  }

  async toClipboard (id) {
    let pass = await Passwords.getPassword(id)

    Clipboard.setString(pass)

    Toast.show({
      text: 'Copied!',
      buttonText: 'Okay',
      duration: 2000
    })
  }

  renderIcons () {
    let { item } = this.state
    if (this.props.loading) {
      return <Right />
    } else {
      let color = 'grey'
      if (item.status === 0) color = 'lime'
      else if (item.status === 1) color = 'orange'
      else if (item.status === 2) color = 'red'

      return <Right>
        <Button transparent>
          <Icon type='FontAwesome' name='shield' style={{ color }} />
        </Button>
        {this.state.favoriteUpdating
          ? <Button transparent>
            <Spinner color='white' />
          </Button>
          : <Button transparent onPress={this.setFavorite}>
            <Icon
              type='MaterialIcons'
              name={item.favorite ? 'star' : 'star-border'}
              style={{ color: item.favorite ? 'yellow' : 'white', fontSize: 30 }}
              active={Boolean(item.favorite)}
            />
          </Button>
        }
      </Right>
    }
  }

  stopEditing () {
    this.setState({
      editing: false,
      item: { ...this.state.untouchedItem },
    })
  }

  startEditing () {
    this.setState({ editing: true })
  }

  async setFavorite () {
    this.setState({ favoriteUpdating: true })
    let item = await Passwords.setFavorite(this.state.item.id)
    if (!(item instanceof Error)) {
      this.setState({ item })
    }
    this.setState({ favoriteUpdating: false })
  }

  render () {
    return (
      <Container>
        <Header style={{ backgroundColor: Colors.bgColor }}>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon type='MaterialIcons' name='arrow-back' />
            </Button>
          </Left>
          <Body>
            <Title>Site View</Title>
            <Subtitle numberOfLines={1}>{this.state.item.label}</Subtitle>
          </Body>
          {this.renderIcons()}
        </Header>
        <Content padder>
          {this.props.loading
            ? <View style={styles.spinnerView}>
              <Spinner style={styles.spinnerContent} color={Colors.bgColor} />
              <Text style={{ color: Colors.bgColor, marginTop: 20, ...styles.spinnerContent }}>{this.props.statusText}</Text>
            </View>
            : <View>
              <Form>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Username</Label>
                  <Input
                    disabled={!this.state.editing}
                    defaultValue={this.state.item.username}
                    value={this.state.item.username}
                    onChangeText={(filter) => this.updateHandler('username', filter)} />
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Password</Label>
                  <Input
                    disabled={!this.state.editing}
                    secureTextEntry={!this.state.showPassword && !this.state.editing}
                    defaultValue={this.state.item.password}
                    value={this.state.item.password}
                    style={{ width: '75%' }}
                    onChangeText={(filter) => this.updateHandler('password', filter)} />
                  {!this.state.editing && <Button transparent style={styles.copyPassButton}
                    onPress={() => { this.toClipboard(this.state.item.id) }}>
                    <Icon type='MaterialIcons' name='content-copy' style={styles.showPassIcon} />
                  </Button>}
                  {!this.state.editing && <Button transparent style={styles.showPassButton}>
                    <Icon active style={styles.showPassIcon}
                      type='MaterialIcons' name={this.state.showPassword ? 'visibility' : 'visibility-off'}
                      onPress={() => this.setState({ showPassword: !this.state.showPassword })} />
                  </Button>}
                  {this.state.editing && <Button transparent style={styles.showPassButton}
                    onPress={() => this.props.togglePasswordModal(true)}>
                    <Icon active style={styles.showPassIcon} type='MaterialIcons' name='update' />
                  </Button>}
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Address</Label>
                  <Input
                    disabled={!this.state.editing}
                    defaultValue={this.state.item.url}
                    value={this.state.item.url}
                    onChangeText={(filter) => this.updateHandler('url', filter)} />
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Notes</Label>
                  <Textarea
                    disabled={!this.state.editing}
                    rowSpan={5}
                    style={{ width: '100%' }}
                    defaultValue={this.state.item.notes}
                    value={this.state.item.notes}
                    onChangeText={(filter) => this.updateHandler('notes', filter)} />
                </Item>
              </Form>
              {this.state.editing
                ? <View style={{ flexDirection: 'row', marginTop: 20 }}>
                  <Button block danger
                    onPress={this.delete}>
                    <Icon type='MaterialIcons' name='delete' style={{ color: 'white' }} />
                  </Button>
                  <Button block success
                    style={{ flex: 1, marginLeft: 20, marginRight: 20 }}
                    onPress={this.save}>
                    <Text>Save</Text>
                  </Button>
                  <Button block dark onPress={this.stopEditing}>
                    <Icon type='MaterialIcons' name='close' />
                  </Button>
                </View>
                : <View style={{ flexDirection: 'row', marginTop: 20 }}>
                  <Button bordered
                    style={{ flex: 1, borderColor: Colors.bgColor, justifyContent: 'center' }}
                    onPress={this.startEditing}>
                    <Text style={{ color: Colors.bgColor }}>Edit</Text>
                  </Button>
                </View>
              }
            </View>
          }
          <GeneratePasswordModal onSelectPassword={(value) => { this.updateHandler('password', value) }} />
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.app.loading,
    statusText: state.app.statusText,
    passwordModalValue: state.app.passwordModalValue,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    togglePasswordModal: (...args) => { dispatch(togglePasswordModal.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SingleView))

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
