const { Forbidden, GeneralError } = require('@feathersjs/errors');
const logger = require('../../logger');
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
	async find(params) {
		const { userId } = params.account;
		const userServiceParams = {
			query: {
				$populate: ['roles'],
			},
		};
		let user = {};
		try {
			user = await this.app.service('/users').get(userId, userServiceParams);
		} catch (err) {
			logger.warning(err);
			throw new Forbidden('Your access token is not valid.');
		}
		try {
			user.schoolName = (await this.app.service('/schools').get(user.schoolId)).name;
		} catch (err) {
			logger.warning(err);
			throw new GeneralError('Can\'t find connected school.');
		}
		return user;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/me', new Service());

	const me = app.service('/me');

	me.hooks(hooks);
};
