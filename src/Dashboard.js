import React, { Component } from 'react'
import {
  Platform,
  StyleSheet,
  BackHandler,
} from 'react-native'
import fs from 'react-native-fs'
import { withRouter } from 'react-router-native'
import { connect } from 'react-redux'
import {
  Header,
  Container,
  Icon,
  Item,
  Input,
  View,
  Spinner,
  Button,
} from 'native-base'
import {
  setLoading,
  pushPassword,
  setSettings,
  setLastLogin,
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
import FooterMenu from './FooterMenu'
import SiteList from './SiteList'

class Dashboard extends Component {
  constructor (props) {
    super(props)

    this.handleSearch = this.handleSearch.bind(this)
    this.handleRefresh = this.handleRefresh.bind(this)
    this.handleChangeFolder = this.handleChangeFolder.bind(this)
    this.getData = this.getData.bind(this)
    this.getFolder = this.getFolder.bind(this)
    this.handleClearSearchFilter = this.handleClearSearchFilter.bind(this)

    this.searchTimeout = null
    this.state = {
      passwordList: [],
      filtering: false,
      folder: {}
    }

    const { user, password } = this.props.settings
    if (user === '' && password === '') {
      this.returnToLogin()
    }
  }

  async componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.props.currentFolder !== ROOT_FOLDER) {
        this.handleChangeFolder(this.state.folder.parent)
      } else if (this.props.history.location === this.props.history.entries[0]) {
        BackHandler.exitApp()
      } else {
        this.props.history.goBack()
      }

      return true
    })

    const rootDir = Platform.select({
      ios: fs.MainBundlePath,
      android: fs.DocumentDirectoryPath,
    })

    const dbName = this.props.settings.dbName
    try {
      await fs.stat(`${rootDir}/${dbName}`)
        .then((statResult) => {
          if (__DEV__) console.log('DB File Stat', statResult)
        })
    } catch (err) {
      if (__DEV__) console.log('DB File not exists')
      await this.props.setSettings({ dbName: new Date().getTime().toString() })
    }

    await API.openDB(dbName, 'Dashboard.js')
    await this.handleChangeFolder(this.props.currentFolder)
  }

  componentWillUnmount () {
    this.backHandler.remove()
  }

  async fetchPasswords () {
    this.props.setLoading(true, 'Pulling sites...')
    const { status } = await Passwords.fetchAll()

    if (status === 401) {
      await API.dropDB(this.props.settings.dbName)
      this.returnToLogin()
      return false
    } else if (status !== 200) {
      return false
    }

    this.props.setLoading(false, 'Loading...')
    return true
  }

  async fetchFolders () {
    this.props.setLoading(true, 'Pulling folders...')
    const { status } = await Folders.fetchAll()

    if (status === 401) {
      await API.dropDB(this.props.settings.dbName)
      this.returnToLogin()
    } else if (status !== 200) {
      return false
    }

    this.props.setLoading(false, 'Loading...')
    return true
  }

  async fetchData () {
    await this.fetchPasswords()
    await this.fetchFolders()
    this.props.touchLastLogin()
  }

  async getPasswords () {
    this.props.setLoading(true, 'Loading sites...')
    const passwords = await Passwords.getFromFolder(this.props.currentFolder,
      ['id', 'label', 'url', 'username'])
    return passwords.map((item) => { return { ...item, type: 'site' } })
  }

  async searchPasswords () {
    this.setState({ filtering: true })
    let rows = await Passwords.search(this.props.filter, ['label', 'uri'], ['id', 'label', 'uri', 'username'])
    rows = rows.map((item) => { return { ...item, type: 'site' } })

    await this.setState({
      passwordList: rows,
      filtering: false,
    })

    return rows
  }

  async getFolder () {
    let folder = {}

    if (this.props.currentFolder === ROOT_FOLDER) {
      folder = {
        id: this.props.currentFolder,
        label: '/',
        parent: ROOT_FOLDER,
      }
    } else {
      folder = await Folders.getItem(this.props.currentFolder)
    }

    await this.setState({ folder })
    return folder
  }

  async getFolders () {
    this.props.setLoading(true, 'Loading folders...')
    const folders = await Folders.getChildren(this.props.currentFolder,
      ['id', 'label', 'parent'])
    return folders.map((item) => { return { ...item, type: 'folder' } })
  }

  async getData () {
    await this.props.setLoading(true, 'Loading...')
    await this.getFolder()

    let passwords = []
    let folders = []
    if (this.props.filter.length > 2) {
      passwords = await this.searchPasswords()
    } else {
      passwords = await this.getPasswords()
      folders = await this.getFolders()
    }

    await this.setState({ passwordList: [...folders, ...passwords] })
    this.props.setLoading(false)
  }

  async handleRefresh () {
    await this.fetchData()
    await this.getData()
  }

  returnToLogin () {
    this.props.setLastLogin(0)
    this.props.setSettings({
      user: '',
      password: ''
    })
    this.props.history.push('/login')
  }

  async handleSearch (filter) {
    await this.props.setPasswordFilter(filter)

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }

    this.searchTimeout = setTimeout(this.getData, 300)
  }

  async handleClearSearchFilter () {
    await this.handleSearch('')
  }

  async handleChangeFolder (id) {
    await this.props.setCurrentFolder(id)
    if (__DEV__) console.log('handleChangeFolder', id)

    if (this.props.lastLogin === 0) {
      await this.fetchData()
    }

    this.getData()
  }

  render () {
    return (
      <Container>
        <Header searchBar rounded style={{ backgroundColor: Colors.bgColor }}>
          <Item>
            {this.state.filtering
              ? <Spinner color='black' size='small' style={{ padding: 10 }} />
              : <Icon type='MaterialIcons' name='search' />}
            <Input placeholder='Search' defaultValue={this.props.filter} onChangeText={this.handleSearch} />
            {this.props.filter.length !== 0
              ? <Button transparent onPress={this.handleClearSearchFilter} style={{ paddingTop: 3 }}>
                <Icon type='MaterialIcons' name='close' style={{ color: Colors.grey, marginRight: 8 }} />
              </Button>
              : null}
          </Item>
          <View style={{ alignSelf: 'center', marginLeft: 10 }}>
            <Button transparent onPress={this.handleRefresh}>
              <Icon type='MaterialIcons' name='sync' style={{ color: 'white', fontSize: 32 }} />
            </Button>
          </View>
        </Header>
        <View padder style={{ flex: 1 }}>
          <SiteList
            onChangeFolder={this.handleChangeFolder}
            passwordList={this.state.passwordList}
            folder={this.state.folder}
          />
        </View>
        {!this.props.loading && <Button
          rounded primary large
          style={styles.actionButton}
          onPress={() => this.props.history.push('/create')}
                                >
          <Icon type='MaterialIcons' name='add' style={{ fontSize: 40, marginLeft: 8 }} />
        </Button>}
        <FooterMenu />
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
    display: 'flex',
    height: '100%',
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
    bottom: 75,
    right: 20,
    backgroundColor: Colors.bgColor,
    paddingLeft: 1,
  },
})
