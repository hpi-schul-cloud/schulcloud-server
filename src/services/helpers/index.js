'use strict';

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);
	const RegistrationService = require('./registration')(app);
	const HashService = require('./hash')(app);
	const LdapService = require('./ldap')(app);
	const SyncService = require('./ldapsync')(app);

	app.use('/mails', new MailService());
	app.use('/registration', new RegistrationService());
	app.use('/hash', new HashService());
	app.use('/ldap', new LdapService());
	app.use('/ldapsync', new SyncService());
};
