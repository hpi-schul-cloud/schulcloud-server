/* eslint-disable global-require */


module.exports = function init() {
	const app = this;

	const MailService = require('./service')(app);
	const HashService = require('./hash')(app);

	app.use('/mails', new MailService());
	app.use('/hash', new HashService());
};
