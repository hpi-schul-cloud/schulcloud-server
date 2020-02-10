const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

class ApiKeyStrategy extends AuthenticationBaseStrategy {
	parse(req, res) {
		if (req.headers['x-api-key']) {
			return {
				strategy: this.name,
				apiKey: req.headers['x-api-key'],
			};
		}
		return null;
	}

	async authenticate(authentication, params) {
		// todo: compare keys to a database collection instead.
		if (authentication.apiKey === this.app.Config.data.CALENDAR_API_KEY) {
			return {
				authentication: { strategy: this.name },
			};
		}
		throw new NotAuthenticated('invalid token');
	}
}

module.exports = ApiKeyStrategy;
