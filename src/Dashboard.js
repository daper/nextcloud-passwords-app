import React, {Component} from 'react'
import {
  Clipboard,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
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
} from 'native-base'
import {
  setLoading,
  pushPassword,
  setSettings,
  setLastLogin,
  pushRoute,
  setPasswordFilter,
} from './redux'
import API, {Colors} from './API'

type Props = {}
class Dashboard extends Component<Props> {
  constructor(props) {
    super(props)

    this.toClipboard = this.toClipboard.bind(this)
    this.passwordToClipboard = this.passwordToClipboard.bind(this)
    this.search = this.search.bind(this)
    this.refresh = this.refresh.bind(this)
    this.renderRow = this.renderRow.bind(this)

    this.state = {
      passwordList: [],
      filtering: false,
    }

    let {user, password} = this.props.settings
    if (user === '' && password === '') {
      this.returnToLogin()
    }
  }

  componentWillMount() {
    this.props.pushRoute(this.props.location.pathname)
  }

  async fetchData(fresh = false) {
    let list = []
    let fields = ['id', 'label', 'url', 'username']
    if (!fresh) {
      this.props.setLoading(true, 'Loading sites...')
      list = await API.getList(fields)
      if (__DEV__) console.log('First list item', list[0])
      this.props.setLoading(false)
    }

    if (fresh || list.length === 0) {
      this.props.setLoading(true, 'Pulling sites...')
      let {status, data, error} = await API.fetchList()

      if (status === 200) {
        list = await API.getList(fields)
        this.setState({
          passwordList: list
        })
      } else if(status === 401) {
        await API.dropDB()
        this.returnToLogin()
      } else {
        // Implement some kind of retry?
        // catch more errors
      }

      this.props.setLoading(false, 'Loading...')
    } else {
      this.setState({
        passwordList: list
      })
    }    
  }

  async componentDidMount() {
    if (this.props.filter.length) {
      await this.search(this.props.filter)
    } else if (this.state.passwordList.length === 0) {
      await this.fetchData()
    }
  }

  refresh() {
    this.fetchData(true)
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
    this.props.setPasswordFilter(filter)

    this.setState({filtering: true})
    let rows = await API.search(filter, ['label', 'uri'], ['id', 'label', 'uri', 'username'])

    this.setState({
      passwordList: rows,
      filtering: false,
    })
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
    let pass = await API.getPassword(id)
    this.toClipboard(pass)
  }

  renderRow(item) {
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
            <Icon type="FontAwesome" name="user" color='grey' style={{color: 'grey'}} />
          </Button>
          <Button transparent onPress={() => {this.passwordToClipboard(item.id)}} style={{right: -20}}>
            <Icon type="FontAwesome" name="clipboard" color='grey' style={{color: 'grey'}} />
          </Button>
        </Right>
      </ListItem>
    )
  }

  render() {
    return (
      <Container>
        <Header searchBar rounded style={{backgroundColor: Colors.bgColor}}>
          <Item>
            {this.state.filtering ?
              <Spinner color="black" size="small" style={{padding: 10}}/>
              :
              <Icon type="FontAwesome" name="search" />
            }
            <Input placeholder="Search" defaultValue={this.props.filter} onChangeText={this.search} />
          </Item>
          <View style={{alignSelf: 'center', marginLeft: 10}}>
          <Button transparent onPress={this.refresh}>
            <Icon name="sync" style={{color: 'white', fontSize: 32}} />
          </Button>
          </View>
        </Header>
        <Content padder>
        {this.props.loading ? 
          <View style={styles.spinnerView}>
            <Spinner style={styles.spinnerContent} color={Colors.bgColor} />
            <Text style={{color: Colors.bgColor, marginTop: 20, ...styles.spinnerContent}}>{this.props.statusText}</Text>
          </View>  
          :
          <List style={{paddingBottom: 80}}
            dataArray={this.state.passwordList}
            renderRow={this.renderRow} />
        }
        </Content>
        <Button rounded primary large style={styles.actionButton}>
          <Icon type="FontAwesome" name="plus" style={{fontSize: 30}} />
        </Button>
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