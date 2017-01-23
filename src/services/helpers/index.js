'use strict';

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);

	app.use('/mails', new MailService());
};
