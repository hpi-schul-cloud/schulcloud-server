const request = require('request-promise-native');
const { Configuration } = require('@schul-cloud/commons');

const externalApiRequest = (baseUrl) =>
	request.defaults({
		baseUrl,
		timeout: Configuration.get('REQUEST_TIMEOUT'),
		json: true,
	});

module.exports = externalApiRequest;
