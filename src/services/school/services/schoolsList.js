const { schoolModel } = require('../model');

class SchoolsListService {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find() {
		const schoolQuery = {
			purpose: { $ne: 'expert' },
		};
		const systemsQuery = {
			path: 'systems',
			select:
				'_id type alias oauthConfig.clientId oauthConfig.authEndpoint oauthConfig.codeRedirectUri oauthConfig.responseType oauthConfig.scope oauthConfig.provider',
			match: { $or: [{ type: { $ne: 'ldap' } }, { 'ldapConfig.active': { $eq: true } }] },
		};
		const schools = await schoolModel
			.find(schoolQuery)
			.populate(systemsQuery)
			.select(['name', 'systems'])
			.sort('name')
			.lean()
			.exec();
		return schools;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	SchoolsListService,
};
