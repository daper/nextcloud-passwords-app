import React, {Component} from 'react'
import {
	StyleSheet,
	Modal,
	TouchableOpacity,
	Slider,
} from 'react-native'
import {
	View,
	Header,
	Body,
	Title,
	Right,
	Left,
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
import {connect} from 'react-redux'
import API, {Colors} from './API'
import {togglePasswordModal, setPasswordModalValue} from './redux'

type Props = {}
export class GeneratePasswordModal extends Component<Props> {
	constructor(props) {
		super(props)

		this.requestNewPassword = this.requestNewPassword.bind(this)
		this.closeModal = this.closeModal.bind(this)
		this.usePassword = this.usePassword.bind(this)

		this.state = {
			requestingNewPassword: false,
			enableNumbers: true,
			enableSpecial: true,
			strength: 2
		}
	}

	async requestNewPassword() {
		this.setState({requestingNewPassword: true})

		let data = await API.generateDefaultPassword({
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

	closeModal() {
		this.props.togglePasswordModal(false)
	}

	usePassword() {
		this.closeModal()
		if (this.props.passwordModalValue !== '') {
			this.props.onSelectPassword(this.props.passwordModalValue)
		}
	}

	render() {
		return <Modal
			animationType="none"
			transparent={true}
			visible={this.props.passwordModalVisible}
			onRequestClose={this.closeModal}>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<Header style={{backgroundColor: Colors.bgColor}}>
						<Body>
							<Title style={{fontSize: 16}}>Generate Password</Title>
						</Body>
						<Right>
							<Button block transparent onPress={this.closeModal}>
								<Icon type="FontAwesome" name="times" />
							</Button>
						</Right>
					</Header>
					<Content padder style={styles.modalContentContent}>
						<Item>
							<Input placeholder='password'
								value={this.props.passwordModalValue}/>
							{!this.state.requestingNewPassword ?
								<Button transparent onPress={this.requestNewPassword}>
									<Icon active name='sync' style={{fontSize: 40, color: 'grey'}} />
								</Button>
								:
								<Spinner style={{height: 10}} color={Colors.bgColor} />
							}
						</Item>
						<Item>
							<CheckBox checked={this.state.enableNumbers}
								onPress={() => this.setState({enableNumbers: this.state.enableNumbers ? false : true})}
							/>
							<Button transparent full
								onPress={() => this.setState({enableNumbers: this.state.enableNumbers ? false : true})}>
								<Text uppercase={false} style={{marginLeft: 30, color: 'grey'}}>Enable numbers</Text>
							</Button>
						</Item>
						<Item>
							<CheckBox checked={this.state.enableSpecial}
								onPress={() => this.setState({enableSpecial: this.state.enableSpecial ? false : true})}
							/>
							<Button transparent full
								onPress={() => this.setState({enableSpecial: this.state.enableSpecial ? false : true})}>
								<Text uppercase={false} style={{marginLeft: 30, color: 'grey'}}>Enable special</Text>
							</Button>
						</Item>
						<Item style={{height: 50}}>
							<Text style={{width: '10%', marginLeft: 10}}>{this.state.strength}</Text>
							<Slider
								step={1}
								maximumValue={10}
								minimumValue={1}
								onValueChange={(value) => {this.setState({strength: value})}}
								value={this.state.strength}
								style={{width: '80%'}}
								thumbTintColor={Colors.bgColor}
								minimumTrackTintColor={Colors.bgColor}
							/>
						</Item>
					</Content>
					<Footer>
						<FooterTab>
							<Button full success style={styles.modalFooterStyle} onPress={this.usePassword}>
								<Text style={{color: 'white', fontSize: 14}}>Use</Text>
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