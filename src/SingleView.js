import React, { Component } from 'react'
import {
  StyleSheet,
  BackHandler,
  Dimensions,
  Linking,
} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import { withRouter } from 'react-router-native'
import {
  Container,
  Header,
  Body,
  Title,
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
    this.handleStopEditing = this.handleStopEditing.bind(this)
    this.handleStartEditing = this.handleStartEditing.bind(this)
    this.handleSetFavorite = this.handleSetFavorite.bind(this)
    this.handleGoBack = this.handleGoBack.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleSave = this.handleSave.bind(this)

    this.state = {
      untouchedItem: {},
      item: {},
      showPassword: false,
      editing: false,
      notes: '',
      showPasswordModal: false,
      favoriteUpdating: false,
    }

    const { match } = props
    if (__DEV__) console.log(`Showing ${match.params.id}`)
  }

  async componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.handleGoBack()
      return true
    })

    const { id } = this.props.match.params

    this.props.setLoading(true, 'Loading site...')

    const item = await Passwords.getItem(id)
    if (__DEV__) console.log(item)

    item.notes = String(item.notes)
    item.url = String(item.url)
    item.password = String(item.password)
    item.username = String(item.username)

    if (item.customFields.length !== 0) {
      item.customFields = JSON.parse(item.customFields)
    } else {
      item.customFields = []
    }

    this.setState({ item, untouchedItem: { ...item } })

    this.props.setLoading(false)
  }

  componentWillUnmount () {
    this.backHandler.remove()
  }

  async handleSave () {
    try {
      this.props.setLoading(true, 'Saving...')
      const { id, label, username, password, url, notes, customFields } = this.state.item
      await Passwords.updateItem({ id, label, username, password, url, notes, customFields: JSON.stringify(customFields) })
      const item = this.state.item
      await this.setState({ item, untouchedItem: { ...item } })
    } catch (err) {
      if (__DEV__) console.log('handleSave', err)
    }
    this.props.setLoading(false)
  }

  handleDelete () {
    ActionSheet.show({
      options: ['Delete', 'Cancel'],
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      title: 'Do you really want to delete this entry?'
    },
    (buttonIndex) => {
      if (buttonIndex === 0) {
        Passwords.deleteItem(this.state.item.id)
          .then(() => this.handleGoBack())
          .catch((err) => {
            if (__DEV__) console.log('err', err)
          })
      }
    })
  }

  updateHandler (name, value) {
    const item = this.state.item

    if (name === 'customFields') {
      const index = item.customFields.findIndex((item) => item.id === value.id)
      item.customFields[index] = value
    } else {
      item[name] = value
    }

    this.setState({ item })
  }

  async handleGoBack () {
    this.props.history.goBack()
  }

  toClipboard (value, element) {
    Clipboard.setString(value)

    Toast.show({
      text: element + ' copied!',
      buttonText: 'Okay',
      duration: 2000
    })
  }

  async passwordToClipboard (id) {
    const pass = await Passwords.getPassword(id)
    this.toClipboard(pass, 'Password')
  }

  renderIcons () {
    const { item } = this.state
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
          : <Button transparent onPress={this.handleSetFavorite}>
            <Icon
              type='MaterialIcons'
              name={item.favorite ? 'star' : 'star-border'}
              style={{ color: item.favorite ? 'yellow' : 'white', fontSize: 30 }}
              active={Boolean(item.favorite)}
            />
          </Button>}
      </Right>
    }
  }

  handleStopEditing () {
    this.setState({
      editing: false,
      item: { ...this.state.untouchedItem },
    })
  }

  handleStartEditing () {
    this.setState({ editing: true })
  }

  async handleSetFavorite () {
    this.setState({ favoriteUpdating: true })
    const item = await Passwords.setFavorite(this.state.item.id)
    if (!(item instanceof Error)) {
      this.setState({ item })
    }
    this.setState({ favoriteUpdating: false })
  }

  handleOpenURL (url) {
    Linking.openURL(url).catch(() => {
      Toast.show({
        text: 'Not a link!',
        buttonText: 'Okay',
        duration: 1000,
        type: 'warning'
      })
    })
  }

  renderCustomField (field) {
    switch (field.type) {
      case 'text':
        return (
          <Item key={field.id} stackedLabel disabled={!this.state.editing} last>
            <Label>{field.label}</Label>
            <Input
              disabled={!this.state.editing}
              defaultValue={field.value}
              value={field.value}
              onChangeText={(filter) => this.updateHandler('customFields', { ...field, value: filter })}
            />
          </Item>
        )
      case 'secret': {
        const showPasswordKey = `showPassword_${field.label}`
        return (
          <Item key={field.id} stackedLabel disabled={!this.state.editing} last>
            <Label>{field.label}</Label>
            <Input
              disabled={!this.state.editing}
              secureTextEntry={!this.state[showPasswordKey] && !this.state.editing}
              defaultValue={field.value}
              value={field.value}
              style={{ width: '75%' }}
              onChangeText={(filter) => this.updateHandler('customFields', { ...field, value: filter })}
            />
            {!this.state.editing && <Button
              transparent style={styles.copyPassButton}
              onPress={() => { this.toClipboard(field.value, field.label) }}
                                    >
              <Icon type='MaterialIcons' name='content-copy' style={styles.showPassIcon} />
            </Button>}
            {!this.state.editing && <Button transparent style={styles.showPassButton}>
              <Icon
                active style={styles.showPassIcon}
                type='MaterialIcons' name={this.state[showPasswordKey] ? 'visibility' : 'visibility-off'}
                onPress={() => this.setState({ [showPasswordKey]: !this.state[showPasswordKey] })}
              />
            </Button>}
          </Item>
        )
      }
      case 'email':
        return (
          <Item key={field.id} stackedLabel disabled={!this.state.editing} last>
            <Label>{field.label}</Label>
            {!this.state.editing
              ? <Button
                transparent onPress={() => this.handleOpenURL(`mailto:${field.value}`)}
                title={field.value}
                >
                <Icon type='MaterialIcons' name='mail-outline' style={{ marginLeft: 8, marginRight: 0 }} />
                <Text uppercase={false} style={{ marginLeft: 0, paddingLeft: 8 }}>{field.value}</Text>
              </Button>
              : <Input
                disabled={!this.state.editing}
                defaultValue={field.value}
                value={field.value}
                onChangeText={(filter) => this.updateHandler('customFields', { ...field, value: filter })}
                />}
          </Item>
        )
      case 'url':
        return (
          <Item key={field.id} stackedLabel disabled={!this.state.editing} last>
            <Label>{field.label}</Label>
            {!this.state.editing
              ? <Button
                transparent onPress={() => this.handleOpenURL(`${field.value}`)}
                title={field.value}
                >
                <Icon type='MaterialIcons' name='link' style={{ marginLeft: 8, marginRight: 0 }} />
                <Text uppercase={false} style={{ marginLeft: 0, paddingLeft: 8 }}>{field.value}</Text>
              </Button>
              : <Input
                disabled={!this.state.editing}
                defaultValue={field.value}
                value={field.value}
                onChangeText={(filter) => this.updateHandler('customFields', { ...field, value: filter })}
                />}
          </Item>
        )
      case 'file':
        break
      default:
        return (
          <Item key={field.id} stackedLabel disabled={!this.state.editing} last>
            <Label>{field.label}</Label>
            <Input
              disabled
              defaultValue={field.value}
              value={field.value}
            />
          </Item>
        )
    }
  }

  render () {
    return (
      <Container>
        <Header style={{ backgroundColor: Colors.bgColor }}>
          <Left>
            <Button transparent onPress={this.handleGoBack}>
              <Icon type='MaterialIcons' name='arrow-back' />
            </Button>
          </Left>
          <Body>
            <Title numberOfLines={1}>{this.state.item.label}</Title>
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
                    onChangeText={(filter) => this.updateHandler('username', filter)}
                  />
                  {!this.state.editing && <Button
                    transparent style={styles.showPassButton}
                    onPress={() => { this.toClipboard(this.state.item.username, 'Username') }}
                                          >
                    <Icon type='MaterialIcons' name='content-copy' style={styles.showPassIcon} />
                  </Button>}
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Password</Label>
                  <Input
                    disabled={!this.state.editing}
                    secureTextEntry={!this.state.showPassword && !this.state.editing}
                    defaultValue={this.state.item.password}
                    value={this.state.item.password}
                    style={{ width: '75%' }}
                    onChangeText={(filter) => this.updateHandler('password', filter)}
                  />
                  {!this.state.editing && <Button
                    transparent style={styles.copyPassButton}
                    onPress={() => { this.passwordToClipboard(this.state.item.id) }}
                                          >
                    <Icon type='MaterialIcons' name='content-copy' style={styles.showPassIcon} />
                  </Button>}
                  {!this.state.editing && <Button transparent style={styles.showPassButton}>
                    <Icon
                      active style={styles.showPassIcon}
                      type='MaterialIcons' name={this.state.showPassword ? 'visibility' : 'visibility-off'}
                      onPress={() => this.setState({ showPassword: !this.state.showPassword })}
                    />
                  </Button>}
                  {this.state.editing && <Button
                    transparent style={styles.showPassButton}
                    onPress={() => this.props.togglePasswordModal(true)}
                                         >
                    <Icon active style={styles.showPassIcon} type='MaterialIcons' name='update' />
                  </Button>}
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Address</Label>
                  {!this.state.editing
                    ? <Button
                      transparent onPress={() => this.handleOpenURL(`${this.state.item.url}`)}
                      title={this.state.item.url}
                      >
                      <Text uppercase={false} style={{ marginLeft: -12, fontSize: 16 }}>{this.state.item.url}</Text>
                    </Button>
                    : <Input
                      disabled={!this.state.editing}
                      defaultValue={this.state.item.url}
                      value={this.state.item.url}
                      onChangeText={(filter) => this.updateHandler('url', filter)}
                      />}
                </Item>
                <Item stackedLabel disabled={!this.state.editing} last>
                  <Label>Notes</Label>
                  <Textarea
                    disabled={!this.state.editing}
                    rowSpan={5}
                    style={{ width: '100%' }}
                    defaultValue={this.state.item.notes}
                    value={this.state.item.notes}
                    onChangeText={(filter) => this.updateHandler('notes', filter)}
                  />
                </Item>
                {(this.state.item.customFields || []).map((field) => this.renderCustomField(field))}
              </Form>
              {this.state.editing
                ? <View style={{ flexDirection: 'row', marginTop: 20 }}>
                  <Button
                    block danger
                    onPress={this.handleDelete}
                  >
                    <Icon type='MaterialIcons' name='delete' style={{ color: 'white' }} />
                  </Button>
                  <Button
                    block success
                    style={{ flex: 1, marginLeft: 20, marginRight: 20 }}
                    onPress={this.handleSave}
                  >
                    <Text>Save</Text>
                  </Button>
                  <Button block dark onPress={this.handleStopEditing}>
                    <Icon type='MaterialIcons' name='close' />
                  </Button>
                </View>
                : <View style={{ flexDirection: 'row', marginTop: 20 }}>
                  <Button
                    bordered
                    style={{ flex: 1, borderColor: Colors.bgColor, justifyContent: 'center' }}
                    onPress={this.handleStartEditing}
                  >
                    <Text style={{ color: Colors.bgColor }}>Edit</Text>
                  </Button>
                </View>}
            </View>}
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
