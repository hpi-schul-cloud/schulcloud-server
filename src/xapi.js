const rp = require('request-promise-native');

const xapi = app => rp.defaults({
	baseUrl: app.get('services').xapi,
	json: true,
	headers: {
		Authorization: app.get('xapiAuth'),
		'X-Experience-API-Version': '1.0.3'
	}
});

module.exports = xapi;
