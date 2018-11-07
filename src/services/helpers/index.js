'use strict';

module.exports = function () {
	const app = this;

	const MailService = require('./service')(app);
	const HashService = require('./hash')(app);
	const SyncService = require('./sync')(app);

	app.use('/mails', new MailService());
	app.use('/hash', new HashService());
	app.use('/sync', new SyncService());
};
