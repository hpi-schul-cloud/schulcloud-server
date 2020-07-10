const { authenticate } = require('@feathersjs/authentication');
const { iff, provider } = require('feathers-hooks-common');
const { consentTypes } = require('../model');
const { restrictToCurrentUser } = require('../hooks/consents');
const { userToConsent } = require('../utils');

const removeQuery = (context) => ({
	...context,
	params: {
		...context.params,
		query: {},
	},
});

const consentCheckHooks = {
	all: [authenticate('jwt')],
	get: [iff(provider('external'), restrictToCurrentUser, removeQuery)],
};


const getVersion = (ref, type, schoolId, date) => ref.get('/consentVersions', {
	query: {
		publishedAt: {
			$gt: new Date(date),
			$lt: new Date(),
		},
		schoolId,
		consentTypes: type,
		$sort: { publishedAt: -1 },
	},
});


class ConsentCheckService {
	async get(_id, params) {
		const { query } = params;
		const user = await this.consentService.get(_id);
		const consent = userToConsent(user);

		if (consent.consentStatus === 'missing') {
			return {
				consentStatus: consent.consentStatus,
			};
		}

		// TODO: check age here to require consent
		const selectedConsent = consent.userConsent || consent.parentConsents[0];
		const { dateOfPrivacyConsent, dateOfTermsOfUseConsent } = (selectedConsent || {});

		const [{ data: privacy }, { data: termsOfUse }] = await Promise.all([
			getVersion(this.versionService, consentTypes.PRIVACY, user.schoolId, dateOfPrivacyConsent),
			getVersion(this.versionService, consentTypes.TERMS_OF_USE, user.schoolId, dateOfTermsOfUseConsent),
		]);

		const haveBeenUpdated = privacy.length !== 0 || termsOfUse.length !== 0;

		if (query.simple) {
			return {
				haveBeenUpdated,
				consentStatus: consent.consentStatus,
			};
		}
		return {
			privacy,
			termsOfUse,
			haveBeenUpdated,
			consentStatus: consent.consentStatus,
		};
	}

	setup(app) {
		this.app = app;
		this.versionService = this.app.service('consentVersionsModel');
		this.userService = this.app.service('/usersModel');
	}
}

module.exports = {
	ConsentCheckService,
	consentCheckHooks,
};
