const { Configuration } = require('@schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { authenticate } = require('@feathersjs/authentication');
const { NotAuthenticated } = reqlib('src/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const { error } = require('../logger');

const CLIENT_API_KEY = 'CLIENT_API_KEY';

const verifyApiKey = (context) => {
	if (Configuration.has(CLIENT_API_KEY)) {
		const key = context.params.headers['x-api-key'];
		if (Configuration.get(CLIENT_API_KEY) !== key) {
			const { path, method, data, id } = context;
			error(`Validation of x-api-key header failed. It should match configuration (${CLIENT_API_KEY}).`, {
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

const authenticateOAuth2 = (scope) => {
	return (context) => {
		context.app.service('/oauth2/introspect').create({
			token: context.params.headers.authorization.replace('Bearer ', '')
		}).then((introspection) => {
			if (introspection.active && introspection.scope.indexOf(scope) !== -1) {
				context.params.account = { userId: introspection.sub };
				return context;
			}
			throw new NotAuthenticated('Invalid access token!');
		}).catch((error) => {
			throw new Error(error);
		});
	}
	
}

const authenticateSC = (without = false, jwt = true, oauth2 = false) => (context) => {
	if (without) return context

	if (oauth2 !== false && context.params.query.auth === 'oauth2') return authenticateOAuth2(oauth2)(context)

	if (jwt) return authenticate('jwt')(context)
}

module.exports = {
	verifyApiKey,
	verifyApiKeyIfProviderIsExternal,
	authenticateSC,
};
