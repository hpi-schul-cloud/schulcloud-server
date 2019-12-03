const hooks = require('feathers-hooks-common');
const cache = require('memory-cache');
const globals = require('../../../config/globals');

// add Message Provider Adapter here
const StatusAdapter = require('./adapter/status');

let messages = [];
// durtion of cache in min
const duration = 5;
let success = false;

/**
 * Building Message Array
 * @param {Adapter} ProviderAdapter
 */
async function addMessageProvider(ProviderAdapter) {
	const data = await ProviderAdapter.getMessage(globals.SC_THEME);
	messages = messages.concat(data.messages);
	success = data.success;
}

/**
 * Service to get an array of alert messages from added Message Providers (e.g: status.schul-cloud.org)
 */
class AlertService {
	async find() {
		messages = [];
		const cachedMessages = cache.get('cachedMessages');
		if (cachedMessages) {
			messages = cachedMessages;
		} else {
			// add Message Provider here
			await addMessageProvider(new StatusAdapter()); // status.schul-cloud.org

			if (success) { cache.put('cachedMessages', messages, duration * 1000 * 60); }
		}
		return messages;
	}
}

module.exports = function alert() {
	const app = this;

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
