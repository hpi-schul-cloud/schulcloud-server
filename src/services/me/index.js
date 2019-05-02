const jwt = require('jsonwebtoken');
const { Forbidden } = require('@feathersjs/errors');
const logger = require('winston');
const hooks = require('./hooks');
const secrets = require('../../middleware/secret');

const authenticationSecret = (secrets.authentication) ? secrets.authentication : 'secrets';

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	static get(jwtBearerToken) {
		return jwt.verify(jwtBearerToken, authenticationSecret, (err, decode) => {
			if (err) {
				logger.warn(err);
				throw new Forbidden('Your access token is not valid.');
			}
			return decode;
		});
	}

	/**
	 * request headers
	 * set Content-Type = application/json
	 * set Authorization = Bearer [jwt]
	 */
	find(params) {
		const { userId } = params.account;
		const userServiceParams = {
			query: {
				$populate: ['roles'],
			},
		};
		return this.app.service('/users').get(userId, userServiceParams).catch((err) => {
			logger.warn(err);
			throw new Forbidden('Your access token is not valid.');
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function setup() {
	const app = this;

	app.use('/me', new Service());

	const me = app.service('/me');

	me.hooks(hooks);
};
