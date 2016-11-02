'use strict';

const authentication = require('feathers-authentication');



module.exports = function() {
    const app = this;
	const AuthenticationService = require('./service')(app);

	let config = app.get('auth');

    app.use('/auth', new AuthenticationService());
    app.configure(authentication(config));
};
