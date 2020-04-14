const { modelServices: { prepareInternalParams } } = require('../../utils');

const MODEL_SERVICE = 'usersModel';

class ConsentService {
	modifyDataForUserSchema(data) {
		return {
			consent: {
				...data,
			},
		};
	}

	async find(params) {
		const { query: oldQuery } = params;
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
			data: users.data.map((user) => ({
				requiresParentConsent: user.requiresParentConsent,
				consentStatus: user.consentStatus,
				...user.consent,
			})),
		};
	}

	async get(_id, params) {
		return this.app.service(MODEL_SERVICE).get(_id, prepareInternalParams(params));
	}

	async patch(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.patch(_id, this.modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	async update(_id, data, params) {
		return this.app
			.service(MODEL_SERVICE)
			.update(_id, this.modifyDataForUserSchema(data), prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	ConsentService,
};
