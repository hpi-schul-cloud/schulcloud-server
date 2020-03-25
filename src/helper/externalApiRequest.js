const request = require('request-promise-native');
const { REQUEST_TIMEOUT } = require('../../config/globals');

const externalApiRequest = (baseUrl) => request.defaults({
	baseUrl,
	timeout: REQUEST_TIMEOUT,
	json: true,
});

module.exports = externalApiRequest;
