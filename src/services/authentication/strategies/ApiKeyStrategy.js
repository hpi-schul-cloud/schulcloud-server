const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { NotAuthenticated } = reqlib('src/errors');
const { Configuration } = require('@hpi-schul-cloud/commons');

class ApiKeyStrategy extends AuthenticationBaseStrategy {
	parse(req, res) {
		if (this.validateApiKey(req.headers['x-api-key'])) {
			return {
				strategy: this.name,
				apiKey: req.headers['x-api-key'],
				// todo: remove route when there are permissions for api-keys
				// eslint-disable-next-line no-underscore-dangle
				route: req._parsedUrl.path.split('/')[1].split('?')[0],
			};
		}
		return null;
	}

	async authenticate(authentication, params) {
		// todo: compare keys to a database collection instead.
		if (this.credentialCheck(authentication.apiKey, authentication.route)) {
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
		return key && typeof key === 'string' && key !== '';
	}

	credentialCheck(key, route) {
		// todo: authenticate against database collection, return permissions.
		// todo: remove route logic, give api-keys permissions instead.

		if (route === 'mails') return key === Configuration.get('CLIENT_API_KEY');
		if (route === 'sync') return key === Configuration.get('SYNC_API_KEY');
		if (route === 'statisticmails') return key === Configuration.get('SYNC_API_KEY');
		if (route === 'resolve') return key === Configuration.get('CALENDAR_API_KEY');

		return false;
	}
}

module.exports = ApiKeyStrategy;
