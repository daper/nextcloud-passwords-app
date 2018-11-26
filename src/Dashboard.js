import React, {Component} from 'react'
import {
  Clipboard,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  BackHandler,
  FlatList,
} from 'react-native'
import {Link, Redirect, withRouter} from "react-router-native"
import {connect} from 'react-redux'
import {
  Header,
  Body,
  Content,
  Container,
  List,
  ListItem,
  Text,
  Right,
  Icon,
  Item,
  Input,
  Toast,
  View,
  Spinner,
  Button,
  Left,
} from 'native-base'
import {
  setLoading,
  pushPassword,
  setSettings,
  setLastLogin,
  pushRoute,
  setPasswordFilter,
  setCurrentFolder,
  touchLastLogin,
} from './redux'
import API, {
  Colors,
  Passwords,
  Folders,
  ROOT_FOLDER
} from './API'

type Props = {}
class Dashboard extends Component<Props> {
  constructor(props) {
    super(props)

    this.toClipboard = this.toClipboard.bind(this)
    this.passwordToClipboard = this.passwordToClipboard.bind(this)
    this.search = this.search.bind(this)
    this.refresh = this.refresh.bind(this)
    this.renderRow = this.renderRow.bind(this)
    this.changeFolder = this.changeFolder.bind(this)
    this.getData = this.getData.bind(this)

    this.searchTimeout = null
    this.state = {
      passwordList: [],
      filtering: false,
      folder: {}
    }

    let {user, password} = this.props.settings
    if (user === '' && password === '') {
      this.returnToLogin()
    }
  }

  componentWillMount() {
    this.props.pushRoute(this.props.location.pathname)
  }
  
  async componentDidMount() {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.props.currentFolder !== ROOT_FOLDER) {
        this.changeFolder(this.state.folder.parent)
      }

      return true
    })

    await this.changeFolder(this.props.currentFolder)
  }

  componentWillUnmount() {
    this.backHandler.remove()
  }

  async fetchPasswords() {
    this.props.setLoading(true, 'Pulling sites...')
    let {status, data, error} = await Passwords.fetchAll()

    if(status === 401) {
      await API.dropDB()
      this.returnToLogin()
      return false
    } else if (status !== 200) {
      return false
    }

    this.props.setLoading(false, 'Loading...')
    return true
  }

  async fetchFolders() {
    this.props.setLoading(true, 'Pulling folders...')
    let {status, data, error} = await Folders.fetchAll()

    if(status === 401) {
      await API.dropDB()
      this.returnToLogin()
    } else if (status !== 200) {
      return false
    }
    
    this.props.setLoading(false, 'Loading...')
    return true
  }

  async fetchData() {
    await this.fetchPasswords()
    await this.fetchFolders()
    this.props.touchLastLogin()
  }

  async getPasswords() {
    this.props.setLoading(true, 'Loading sites...')
    let passwords = await Passwords.getFromFolder(this.props.currentFolder, 
                                          ['id', 'label', 'url', 'username'])
    return passwords.map((item) => {return {...item, type: 'site'}})
  }

  async searchPasswords() {
    this.setState({filtering: true})
    let rows = await Passwords.search(this.props.filter, ['label', 'uri'], ['id', 'label', 'uri', 'username'])
    rows = rows.map((item) => {return {...item, type: 'site'}})

    await this.setState({
      passwordList: rows,
      filtering: false,
    })

    return rows
  }

  async getFolders() {
    this.props.setLoading(true, 'Loading folders...')
    let folders = await Folders.getChildren(this.props.currentFolder,
                                            ['id', 'label', 'parent'])
    return folders.map((item) => {return {...item, type: 'folder'}})
  }

  async getData() {
    let passwords = []
    let folders = []
    if (this.props.filter.length > 2) {
      passwords = await this.searchPasswords()
    } else {
      passwords = await this.getPasswords()
      folders = await this.getFolders()
    }

    await this.setState({passwordList: [...folders, ...passwords]})
    this.props.setLoading(false)
  }

  async refresh() {
    await this.fetchData()
    await this.getData()
  }

  returnToLogin() {
    this.props.setLastLogin(0)
    this.props.setSettings({
      user: '',
      password: ''
    })
    this.props.history.push('/login')
  }

  async search(filter) {
    await this.props.setPasswordFilter(filter)

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }

    this.searchTimeout = setTimeout(this.getData, 400)
  }

  async toClipboard(string) {
    Clipboard.setString(string)

    Toast.show({
      text: "Copied!",
      buttonText: "Okay",
      duration: 2000
    })
  }

  async passwordToClipboard(id) {
    let pass = await Passwords.getPassword(id)
    this.toClipboard(pass)
  }

  renderRow({item}) {
    if (item.type === 'site') {
      return (
        <ListItem noIndent icon last>
          <Body>
            <TouchableOpacity onPress={() => {this.props.history.push(`/view/${item.id}`)}}>
              <Text numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          </Body>
          <Right>
            <Button transparent onPress={() => {this.toClipboard(item.username)}} style={{right: -20}}>
              <Icon type="MaterialIcons" name="person" color='grey' style={{color: 'grey'}} />
            </Button>
            <Button transparent onPress={() => {this.passwordToClipboard(item.id)}} style={{right: -20}}>
              <Icon type="MaterialIcons" name="content-copy" color='grey' style={{color: 'grey'}} />
            </Button>
          </Right>
        </ListItem>
      )
    } else if (item.type === 'folder') {
      return (
        <ListItem noIndent icon last>
          <Left>
            <Button transparent onPress={() => {this.changeFolder(item.id)}}>
              <Icon type="MaterialIcons" name="folder" style={{color: "grey", fontSize: 26}} />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={() => {this.changeFolder(item.id)}}>
              <Text numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          </Body>
        </ListItem>
      )
    } else {
      if (__DEV__) console.log('Unrendered list item', item)
      return null
    }
  }

  async changeFolder(id) {
    this.props.setCurrentFolder(id)
    if (__DEV__) console.log('changeFolder', id)

    if (id === ROOT_FOLDER) {
      await this.setState({folder: {
        id,
        label: '/',
        parent: ROOT_FOLDER,
      }})
    } else {
      let folder = await Folders.getItem(id)
      await this.setState({folder})
    }

    if (this.props.lastLogin === 0) {
      await this.fetchData()
    }
    
    this.getData()
  }

  render() {
    return (
      <Container>
        <Header searchBar rounded style={{backgroundColor: Colors.bgColor}}>
          <Item>
            {this.state.filtering ?
              <Spinner color="black" size="small" style={{padding: 10}}/>
              :
              <Icon type="MaterialIcons" name="search" />
            }
            <Input placeholder="Search" defaultValue={this.props.filter} onChangeText={this.search} />
          </Item>
          <View style={{alignSelf: 'center', marginLeft: 10}}>
          <Button transparent onPress={this.refresh}>
            <Icon type="MaterialIcons" name="sync" style={{color: 'white', fontSize: 32}} />
          </Button>
          </View>
        </Header>
        <Content padder>
          {this.props.currentFolder !== ROOT_FOLDER && 
            <View style={{borderBottomWidth: 1, flexDirection: 'row'}}>
              <Button transparent
                styles={{flex: 1}}
                onPress={() => this.changeFolder(this.state.folder.parent)}>
                <Icon type="MaterialIcons" name="arrow-back" style={{color: Colors.bgColor}} />
              </Button>
              <Button disabled transparent styles={{flex: 1}}>
                <Text>{this.state.folder.label}</Text>
              </Button>
            </View>}
        {this.props.loading ? 
          <View style={styles.spinnerView}>
            <Spinner style={styles.spinnerContent} color={Colors.bgColor} />
            <Text style={{color: Colors.bgColor, marginTop: 20, ...styles.spinnerContent}}>{this.props.statusText}</Text>
          </View>  
          :
          <FlatList style={{paddingBottom: 80}}
            data={this.state.passwordList}
            keyExtractor={(item) => item.id}
            renderItem={this.renderRow} />
        }
        </Content>
        {!this.props.loading && <Button rounded primary large 
            style={styles.actionButton}
            onPress={() => this.props.history.push('/create')}>
            <Icon type="MaterialIcons" name="add" style={{fontSize: 40, marginLeft: 8}} />
          </Button>}
      </Container>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
      loading: state.app.loading,
      statusText: state.app.statusText,
      settings: state.app.settings,
      filter: state.app.filter,
      currentFolder: state.app.currentFolder,
      lastLogin: state.app.lastLogin,
  }
}
 
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    pushPassword: (...args) => { dispatch(pushPassword.apply(ownProps, args)) },
    setSettings: (...args) => { dispatch(setSettings.apply(ownProps, args)) },
    setLastLogin: (...args) => { dispatch(setLastLogin.apply(ownProps, args)) },
    pushRoute: (...args) => { dispatch(pushRoute.apply(ownProps, args)) },
    setPasswordFilter: (...args) => { dispatch(setPasswordFilter.apply(ownProps, args)) },
    setCurrentFolder: (...args) => { dispatch(setCurrentFolder.apply(ownProps, args)) },
    touchLastLogin: (...args) => { dispatch(touchLastLogin.apply(ownProps, args)) },
  }
}
 
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard))

const styles = StyleSheet.create({
  spinnerView: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    height: Dimensions.get('screen').height -128,
    display: 'flex'
  },
  spinnerContent: {
    flex: 1,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 25
  },
  actionButton: {
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.bgColor,
    paddingLeft: 1,
  },
})