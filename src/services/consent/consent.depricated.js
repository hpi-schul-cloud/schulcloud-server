const { BadRequest } = require('@feathersjs/errors');
const { modelServices: { prepareInternalParams } } = require('../../utils');
const { userToConsent, modifyDataForUserSchema } = require('./utils');

const MODEL_SERVICE = 'usersModel';

class ConsentService {
	async find(params) {
		const { query: oldQuery } = params;

		if (({}).hasOwnProperty.call(oldQuery, 'userId')) {
			const user = await this.modelService.get(oldQuery.userId, prepareInternalParams(params));
			return {
				total: 1,
				limit: 25,
				skip: 0,
				data: userToConsent(user),
			};
		}

		if (Object.keys(oldQuery).length !== 0) {
			params.query = {
				constent: {
					...oldQuery,
				},
			};
		} else {
			params.query = {
				consent: {
					$exists: true,
				},
			};
		}


		const users = await this.app.service(MODEL_SERVICE).find(prepareInternalParams(params));
		return {
			...users,
			data: users.data.map(userToConsent),
		};
	}

	async get(_id, params) {
		return this.app.service(MODEL_SERVICE).get(_id, prepareInternalParams(params));
	}

	async create(data, params) {
		if (!({}).hasOwnProperty.call(data, 'userId')) {
			throw BadRequest('Consent could only create with a UserId');
		}

		const { userId, ...consent } = data;

		this.modelServices.patch(
			userId,
			modifyDataForUserSchema(consent),
			prepareInternalParams(params),
		);
	}

	async patch(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.patch(_id, modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	async update(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.update(_id, modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
		this.modelService = this.app.service(MODEL_SERVICE);
	}
}

module.exports = {
	ConsentService,
};
