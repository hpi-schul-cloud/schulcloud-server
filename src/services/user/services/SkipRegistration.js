const { BadRequest } = require('@feathersjs/errors');

class SkipRegistrationService {
	constructor() {
		this.docs = {};
	}

	async create(data, params) {
		// get target user
		const targetUser = await this.app.service('users').get(params.route.userid);

		// sanitize
		if (!((data.parent_privacyConsent && data.parent_termsOfUseConsent)
			|| (data.privacyConsent && data.termsOfUseConsent))) {
			return Promise.reject(new BadRequest('you have to set valid consents!'));
		}
		if (!data.password) return Promise.reject(new BadRequest('you have to set a password!'));
		// check student birthdate
		// check persmisison, importhash
		// create account
		// set consents
		return Promise.resolve(data);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = SkipRegistrationService;
