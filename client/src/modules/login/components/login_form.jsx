import React from 'react';

class LoginForm extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			email: '',
			password: ''
		}
	}

	handleEmailChange(e) {
		this.setState({email: e.target.value});
	}

	handlePasswordChange(e) {
		this.setState({password: e.target.value});
	}

	handleLogin(e) {
		this.props.actions.login.bind(this)({
			email: this.state.email,
			password: this.state.password
		});
	}

	render() {
		return (
			<div className="form-group">
				<input type="text" placeholder="Email" onChange={this.handleEmailChange.bind(this)} />
				<input type="password" placeholder="Passwort" onChange={this.handlePasswordChange.bind(this)} />
				<select><option>Schule 1</option></select>
				<button onClick={this.handleLogin.bind(this)}>Anmelden</button>
			</div>
		);
	}

}

export default LoginForm;
