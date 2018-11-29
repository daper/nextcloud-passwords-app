import React, {Component} from 'react'
import {
  BackHandler,
  StyleSheet,
} from 'react-native'
import {
  Container,
  Header,
  Content,
  View,
  Text,
  Body,
  Icon,
} from 'native-base'
import {connect} from 'react-redux'
import {withRouter} from "react-router-native"
import {
  Colors,
  ROOT_FOLDER,
  Folders,
  Passwords,
} from './API'
import {
  setLoading,
  pushRoute,
  setCurrentFolder,
} from './redux'
import FooterMenu from './FooterMenu'
import SiteList from './SiteList'

type Props = {}
export class Favorites extends Component<Props> {
  constructor(props) {
    super(props)

    this.changeFolder = this.changeFolder.bind(this)

    this.state = {
      passwordList: [],
      folder: {},
    }
  }

  async componentDidMount() {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.props.history.push(this.props.lastRoute)
      return true
    })

    await this.changeFolder(this.props.currentFolder)
  }

  componentWillUnmount() {
    this.props.pushRoute('/favorites')
    this.backHandler.remove()
  }

  async getPasswords() {
    this.props.setLoading(true, 'Loading sites...')
    let passwords = await Passwords.getAllFavorites(['id', 'label', 'url', 'username'])
    return passwords.map((item) => {return {...item, type: 'site'}})
  }

  async getFolder() {
    let folder = {}

    if (true || this.props.currentFolder === ROOT_FOLDER) {
      folder = {
        id: ROOT_FOLDER,
        label: '/',
        parent: ROOT_FOLDER,
      }
    } else {
      folder = await Folders.getItem(this.props.currentFolder)
    }

    await this.setState({folder})
    return folder
  }

  async getFolders() {
    this.props.setLoading(true, 'Loading folders...')
    let folders = await Folders.getFavoriteChildren(this.props.currentFolder,
                                            ['id', 'label', 'parent'])
    return folders.map((item) => {return {...item, type: 'folder'}})
  }

  async getData() {
    await this.props.setLoading(true, 'Loading...')
    await this.getFolder()

    let passwords = await this.getPasswords()
    let folders = await this.getFolders()

    await this.setState({passwordList: [...folders, ...passwords]})
    this.props.setLoading(false)
  }

  async changeFolder(id) {
    await this.props.setCurrentFolder(id)
    if (__DEV__) console.log('changeFolder', id)
    
    this.getData()
  }

  render() {
    return <Container>
      <Header style={{backgroundColor: Colors.bgColor}}>
        <Body style={styles.headerBody}>
          <Icon type="MaterialIcons" name="star" style={styles.headerBodyIcon} />
          <Text style={styles.headerBodyText}>Favorites</Text>
        </Body>
      </Header>
      <Content padder contentContainerStyle={{ flexGrow: 1 }}>
        <SiteList
          onChangeFolder={this.changeFolder}
          passwordList={this.state.passwordList}
          folder={this.state.folder}
        />
      </Content>
      <FooterMenu />
    </Container>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    lastRoute: state.app.lastRoute,
    filter: state.app.filter,
    currentFolder: state.app.currentFolder,
  }
}
 
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    pushRoute: (...args) => { dispatch(pushRoute.apply(ownProps, args)) },
    setCurrentFolder: (...args) => { dispatch(setCurrentFolder.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Favorites))

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