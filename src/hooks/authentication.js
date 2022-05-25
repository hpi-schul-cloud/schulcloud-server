const { Configuration } = require('@hpi-schul-cloud/commons');

const { iff, isProvider } = require('feathers-hooks-common');
const { NotAuthenticated } = require('../errors');
const { error } = require('../logger');

const API__CLIENT_API_KEY = 'API__CLIENT_API_KEY';

const verifyApiKey = (context) => {
	if (Configuration.has(API__CLIENT_API_KEY)) {
		const key = context.params.headers['x-api-key'];
		if (Configuration.get(API__CLIENT_API_KEY) !== key) {
			const { path, method, data, id } = context;
			error(`Validation of x-api-key header failed. It should match configuration (${API__CLIENT_API_KEY}).`, {
				key,
				path,
				method,
				data,
				id,
			});
			throw new NotAuthenticated();
		}
	}
	return context;
};

const verifyApiKeyIfProviderIsExternal = (context) => iff(isProvider('external'), [verifyApiKey])(context);

module.exports = { verifyApiKey, verifyApiKeyIfProviderIsExternal };
