const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, GeneralError } = require('../../errors');
const logger = require('../../logger');
const hooks = require('./hooks');
const { externallyManaged } = require('../helpers/utils');

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
		let school = {};
		try {
			user = await this.app.service('/users').get(userId, userServiceParams);
		} catch (err) {
			logger.warning(err);
			throw new Forbidden('Your access token is not valid.');
		}
		user.accountId = params.account._id;
		try {
			school = await this.app.service('/schools').get(user.schoolId);
			user.schoolName = school.name;
		} catch (err) {
			logger.warning(err);
			throw new GeneralError("Can't find connected school.");
		}
		try {
			user.externallyManaged = await externallyManaged(this.app, user);
		} catch (err) {
			logger.warning(err);
			throw new GeneralError("Can't check externallyManaged");
		}
		user.language = user.language || school.language;
		return user;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = (app) => {
	app.use('/me/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/me', new Service());

	const me = app.service('/me');
	me.hooks(hooks);
};
