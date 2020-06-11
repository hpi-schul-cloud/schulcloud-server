/* eslint-disable global-require */
const { verifyApiKeyIfProviderIsExternal } = require('../../hooks/authentication');

module.exports = function setup() {
	const app = this;

	const MailService = require('./service')(app);
	const HashService = require('./hash')(app);

	app.use('/mails', new MailService());
	app.use('/hash', new HashService());

	const mailHooks = {
		before: {
			all: [verifyApiKeyIfProviderIsExternal],
		},
	};

	app.service('/mails').hooks(mailHooks);
};
