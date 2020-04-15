const { modelServices: { prepareInternalParams } } = require('../../utils');

const MODEL_SERVICE = 'users';

class ConsentService {
	modifyDataForUserSchema(data) {
		return {
			consent: {
				...data,
			},
		};
	}

	async find(params) {
		const mQuery = {
			$limit: params.query.$limit || 25,
		};
		// TODO: add age check to query for all
		if (params.query.consent) {
			const currentDate = new Date();
			const secoundConsentSwitchDate = new Date();
			secoundConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
			const firstConsentSwitchDate = new Date();
			firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - 14);
			switch (params.query.consent) {
				case 'no':
					break;
				case 'parent':
					mQuery.$populate = {
						path: 'user',
						match: {
							birthday: {
								$gt: firstConsentSwitchDate,
								$lte: secoundConsentSwitchDate,
							},
						},
					};
					break;
				case 'completed':
					mQuery.$or = [{
						consent: {
							userConsent: {
								privacyConsent: true,
								termsOfUseConsent: true,
							},
						},
						birthday: {
							$gt: firstConsentSwitchDate,
							$lte: secoundConsentSwitchDate,
						},


					}];
					break;
				default:
			}
		}


		return this.app.service(MODEL_SERVICE).find(prepareInternalParams(params));
	}

	async get(_id, params) {
		return this.modelServices.get(_id, prepareInternalParams(params));
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
		this.modelService = this.app.service(MODEL_SERVICE);
	}
}

module.exports = {
	ConsentService,
};
