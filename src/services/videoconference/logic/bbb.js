const { server: createBBB } = require('bbb-promise');
const { GETAction: get } = require('bbb-promise/lib/util');

function bbb(host, salt) {
	const api = createBBB(host, salt);

	// Extend API wrapper to manage BBB WebHooks.
	// http://docs.bigbluebutton.org/dev/webhooks.html
	api.webhooks = {
		create: (params) => get(host, salt, 'hooks/create', params),
		destroy: (params) => get(host, salt, 'hooks/destroy', params),
		list: (params = {}) => get(host, salt, 'hooks/list', params),
	};

	return api;
}

module.exports = bbb;
