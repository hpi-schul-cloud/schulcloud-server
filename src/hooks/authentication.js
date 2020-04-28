const { Configuration } = require('@schul-cloud/commons');
const { NotAuthenticated } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const { error } = require('../logger');

const CLIENT_API_KEY = 'CLIENT_API_KEY';

const verifyApiKey = (context) => {
	if (Configuration.has(CLIENT_API_KEY)) {
		const key = context.params.headers['x-api-key'];
		if (Configuration.get(CLIENT_API_KEY) !== key) {
			const {
				path, method, data, id,
			} = context;
			error(`Validation of x-api-key header failed. It should match configuration (${CLIENT_API_KEY}).`, {
				key, path, method, data, id,
			});
			throw new NotAuthenticated();
		}
	}
	return context;
};

const verifyApiKeyIfProviderIsExternal = (context) => iff(
	isProvider('external'), [
		verifyApiKey,
	],
)(context);


module.exports = { verifyApiKey, verifyApiKeyIfProviderIsExternal };
