const { Forbidden } = require('@feathersjs/errors');
const logger = require('winston');
const hooks = require('./hooks');

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}
	/**
	 * request headers
	 * set Content-Type = application/json
	 * set Authorization = Bearer [jwt]
	 */
	find(params) {
		const userId = params.account.userId;
		const userServiceParams = {
			query: {
				$populate: ['roles']
			}
		};
		return this.app.service('/users').get(userId, userServiceParams).catch(err => {
			logger.warn(err);
			throw new Forbidden('Your access token is not valid.');
		})
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/me', new Service());

	const me = app.service('/me');

	me.before(hooks.before);
	me.after(hooks.after);
};
