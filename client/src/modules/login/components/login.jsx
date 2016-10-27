import React from 'react';

import LoginForm from './login_form.jsx';

require('../styles/login.less');

class Login extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<h1>Schul-Cloud</h1>
				<LoginForm {...this.props} />
			</div>
		);
	}

}

export default Login;
