'use strict';

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);
	const registrationService = require('./registration')(app);

	app.use('/mails', new MailService());
	app.use('/registration', new registrationService());
};
