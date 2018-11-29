import React, {Component} from 'react'
import {
  Footer,
  FooterTab,
  Button,
  Icon,
} from 'native-base'
import {connect} from 'react-redux'
import {withRouter} from "react-router-native"
import {Colors} from './API'

type Props = {}
export class FooterMenu extends Component<Props> {
  constructor(props) {
    super(props)

    this.navigate = this.navigate.bind(this)
  }

  navigate(route) {
    this.props.history.push(route)
  }

  render() {
    return <Footer>
      <FooterTab style={{backgroundColor: Colors.bgColor}}>
        <Button transparent onPress={() => this.navigate('/dashboard')}>
          <Icon type="MaterialIcons" name="home" style={{color: 'white'}} />
        </Button>
      </FooterTab>
      <FooterTab style={{backgroundColor: Colors.bgColor}}>
        <Button transparent onPress={() => this.navigate('/favorites')}>
          <Icon type="MaterialIcons" name="star" style={{color: 'white'}} />
        </Button>
      </FooterTab>
      <FooterTab style={{backgroundColor: Colors.bgColor}}>
        <Button transparent onPress={() => this.navigate('/settings')}>
          <Icon type="MaterialIcons" name="settings" style={{color: 'white'}} />
        </Button>
      </FooterTab>
    </Footer>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {}
}
 
const mapDispatchToProps = (dispatch, ownProps) => {
  return {}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FooterMenu))