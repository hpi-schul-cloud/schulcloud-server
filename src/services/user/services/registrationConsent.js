const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

const registrationConsentServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

class RegistrationConsentService {
	async get(importHash) {
		const user = await this.importUserLinkService.get(importHash);
		if (!user.userId) {
			throw new BadRequest('Invalid Import Hash!');
		}

		const baseQuery = {
			$limit: 1,
			consentTypes: 'privacy',
			$sort: {
				updatedAt: -1,
			},
		};

		let consentSearchResult = await this.consentVersionService.find({
			query: { ...baseQuery, schoolId: user.schoolId },
		});

		if (consentSearchResult.total === 0) {
			consentSearchResult = await this.consentVersionService.find({
				query: {
					...baseQuery,
					schoolId: { $exists: false },
				},
			});
		}

		const [consent] = consentSearchResult.data;
		return consent;
	}

	setup(app) {
		this.app = app;
		this.importUserLinkService = this.app.service('users/linkImport');
		this.consentVersionService = this.app.service('/consentVersionsModel');
	}
}

module.exports = {
	RegistrationConsentService,
	registrationConsentServiceHooks,
};
