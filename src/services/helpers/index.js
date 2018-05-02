'use strict';

const swaggerDocs = require('./docs/');

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);

	var mailServiceApp = new MailService();
	mailServiceApp.docs = swaggerDocs.mailService;

	app.use('/mails', mailServiceApp);
};
