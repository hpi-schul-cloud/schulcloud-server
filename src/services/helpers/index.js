const setupMailService = require('./service');
const setupHashService = require('./hash');

module.exports = function setup(app) {
	const MailService = setupMailService(app);
	const HashService = setupHashService(app);

	app.use('/mails', new MailService());
	app.use('/hash', new HashService());
};
