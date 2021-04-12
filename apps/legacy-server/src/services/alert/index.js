const hooks = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const Cache = require('./cache');

// add Message Provider Adapter here
const StatusAdapter = require('./adapter/status');

const cache = new Cache(1);
// add Message Provider here
cache.addMessageProvider(new StatusAdapter(), Configuration.get('FEATURE_ALERTS_STATUS_ENABLED'));

/**
 * Service to get an array of alert messages from added Message Providers (e.g: status.hpi-schul-cloud.de)
 */
class AlertService {
	async find() {
		return cache.getMessages();
	}
}

module.exports = function alert() {
	const app = this;

	app.use('/alert/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/alert', new AlertService());
	const service = app.service('/alert');

	service.hooks({
		before: {
			all: [],
			find: [],
			get: [hooks.disallow()],
			create: [hooks.disallow()],
			update: [hooks.disallow()],
			patch: [hooks.disallow()],
			remove: [hooks.disallow()],
		},
	});
};
