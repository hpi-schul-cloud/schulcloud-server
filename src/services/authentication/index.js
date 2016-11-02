'use strict';

const authentication = require('feathers-authentication');



module.exports = function() {
    const app = this;
	const MoodleLoginService = require('./moodle')(app);
	const AccountLoginService = require('./account')(app);

	let config = app.get('auth');



    app.use('/auth/account', new AccountLoginService());
	app.use('/auth/moodle', new MoodleLoginService());
    app.configure(authentication(config));
};
