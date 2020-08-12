import React, { Component } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import {
  View,
  Text,
  Toast,
  Button,
  Icon,
  Spinner,
  List,
  ListItem,
  Body,
  Right,
  Left,
} from 'native-base'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-native'
import {
  Colors,
  ROOT_FOLDER,
  Passwords,
} from './API'
import {
  setLoading,
  setCurrentFolder,
} from './redux'

export class SiteList extends Component {
  constructor (props) {
    super(props)

    this.toClipboard = this.toClipboard.bind(this)
    this.passwordToClipboard = this.passwordToClipboard.bind(this)
    this.renderRow = this.renderRow.bind(this)
  }

  async toClipboard (string, element) {
    Clipboard.setString(string)

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

  renderRow (item) {
    if (item.type === 'site') {
      return (
        <ListItem noIndent icon last>
          <Body>
            <TouchableOpacity onPress={() => { this.props.history.push(`/view/${item.id}`) }}>
              <Text numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          </Body>
          <Right>
            <Button transparent onPress={() => { this.toClipboard(item.username, 'Username') }} style={{ right: -20 }}>
              <Icon type='MaterialIcons' name='person' color='grey' style={{ color: 'grey' }} />
            </Button>
            <Button transparent onPress={() => { this.passwordToClipboard(item.id) }} style={{ right: -20 }}>
              <Icon type='MaterialIcons' name='content-copy' color='grey' style={{ color: 'grey' }} />
            </Button>
          </Right>
        </ListItem>
      )
    } else if (item.type === 'folder') {
      return (
        <ListItem noIndent icon last>
          <Left>
            <Button transparent onPress={() => { this.props.onChangeFolder(item.id) }}>
              <Icon type='MaterialIcons' name='folder' style={{ color: 'grey', fontSize: 26 }} />
            </Button>
          </Left>
          <Body>
            <TouchableOpacity onPress={() => { this.props.onChangeFolder(item.id) }}>
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

  render () {
    return (
      <View>
        {!this.props.loading && this.props.folder.id !== ROOT_FOLDER &&
          <View style={{ borderBottomWidth: 1, flexDirection: 'row' }}>
            <Button
              transparent
              styles={{ flex: 1 }}
              onPress={() => this.props.onChangeFolder(this.props.folder.parent)}
            >
              <Icon type='MaterialIcons' name='arrow-back' style={{ color: Colors.bgColor }} />
            </Button>
            <Button disabled transparent styles={{ flex: 1 }}>
              <Text>{this.props.folder.label}</Text>
            </Button>
          </View>}
        {this.props.loading
          ? <View style={styles.spinnerView}>
            <Spinner style={styles.spinnerContent} color={Colors.bgColor} />
            <Text style={{ color: Colors.bgColor, marginTop: 20, ...styles.spinnerContent }}>{this.props.statusText}</Text>
          </View>
          : <List
            dataArray={this.props.passwordList}
            keyExtractor={(item) => item.id}
            renderRow={this.renderRow}
            ListFooterComponent={<View style={{ height: 80 }} />}
            />}
      </View>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.app.loading,
    statusText: state.app.statusText,
    currentFolder: state.app.currentFolder,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setLoading: (...args) => { dispatch(setLoading.apply(ownProps, args)) },
    setCurrentFolder: (...args) => { dispatch(setCurrentFolder.apply(ownProps, args)) },
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SiteList))

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
})
