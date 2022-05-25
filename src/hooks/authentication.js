const { Configuration } = require('@hpi-schul-cloud/commons');

const { iff, isProvider } = require('feathers-hooks-common');
const { NotAuthenticated } = require('../errors');
const { error } = require('../logger');

const REQUEST_OPTION__CLIENT_API_KEY = 'REQUEST_OPTION__CLIENT_API_KEY';

const verifyApiKey = (context) => {
	if (Configuration.has(REQUEST_OPTION__CLIENT_API_KEY)) {
		const key = context.params.headers['x-api-key'];
		if (Configuration.get(REQUEST_OPTION__CLIENT_API_KEY) !== key) {
			const { path, method, data, id } = context;
			error(`Validation of x-api-key header failed. It should match configuration (${REQUEST_OPTION__CLIENT_API_KEY}).`, {
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
