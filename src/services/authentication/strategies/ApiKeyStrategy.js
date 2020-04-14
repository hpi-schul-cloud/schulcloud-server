const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');

class ApiKeyStrategy extends AuthenticationBaseStrategy {
	parse(req, res) {
		if (this.validateApiKey(req.headers['x-api-key'])) {
			return {
				strategy: this.name,
				apiKey: req.headers['x-api-key'],
			};
		}
		return null;
	}

	async authenticate(authentication, params) {
		// todo: compare keys to a database collection instead.
		if (this.credentialCheck(authentication.apiKey)) {
			return {
				authentication: { strategy: this.name },
			};
		}
		throw new NotAuthenticated('invalid token');
	}

	/**
	 * validate that key exists, is typeof string, and not empty
	 * @param key content of a x-api-key header
	 */
	validateApiKey(key) {
		return (key && typeof key === 'string' && key !== '');
	}

	credentialCheck(key) {
		// todo: authenticate against database collection, return permissions.
		return (key === Configuration.get('CALENDAR_API_KEY'));
	}
}

module.exports = ApiKeyStrategy;
