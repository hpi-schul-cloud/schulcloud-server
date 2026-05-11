const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { consumer } = require('./strategies/LDAPSyncerConsumer');
const UserAccountService = require('./services/UserAccountService');

module.exports = function setup(app) {
	app.use('/sync/userAccount', new UserAccountService(), { methods: [] });

	app.use('/sync/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	if (Configuration.get('FEATURE_SYNCER_CONSUMER_ENABLE') === true) {
		app.configure(consumer);
	}
};
