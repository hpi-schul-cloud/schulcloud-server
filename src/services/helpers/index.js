'use strict';

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);
	const RegistrationService = require('./registration')(app);
	const HashService = require('./hash')(app);

	app.use('/mails', new MailService());
	app.use('/registration', new RegistrationService());
	app.use('/hash', new HashService());
};
