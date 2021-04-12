const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { consentTypes } = require('../model');
const { restrictToCurrentUser } = require('../hooks/consentCheck');
const { userToConsent } = require('../utils/consent');

const removeQuery = (context) => ({
	...context,
	params: {
		...context.params,
		query: {},
	},
});

const consentCheckHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [iff(isProvider('external'), restrictToCurrentUser, removeQuery)],
	},
};

const getVersion = (ref, type, schoolId, date) =>
	ref.find({
		query: {
			publishedAt: {
				$gt: new Date(date),
				$lte: new Date(),
			},
			$or: [
				{
					schoolId: {
						$exists: false,
					},
				},
				{ schoolId },
			],
			consentTypes: type,
			$sort: {
				schoolId: -1,
				publishedAt: -1,
			},
		},
	});

const getRelevantConsentVersions = (data) => {
	if (data.length === 0) return data;
	const ref = data[0];
	if (!{}.hasOwnProperty.call(ref, 'schoolId')) return data;
	return data.filter((version) => ({}.hasOwnProperty.call(version, 'schoolId')));
};

class ConsentCheckService {
	async find(params) {
		const _id = params.route.userId;
		const { query = {} } = params;
		const user = await this.userService.get(_id);
		const consent = userToConsent(user);

		if (['missing', 'unknown'].includes(consent.consentStatus)) {
			return {
				consentStatus: consent.consentStatus,
			};
		}

		// TODO: check age here to require consent
		const selectedConsent = consent.userConsent || consent.parentConsents[0];
		const { dateOfPrivacyConsent, dateOfTermsOfUseConsent } = selectedConsent || {};

		let [{ data: privacy }, { data: termsOfUse }] = await Promise.all([
			getVersion(this.versionService, consentTypes.PRIVACY, user.schoolId, dateOfPrivacyConsent),
			getVersion(this.versionService, consentTypes.TERMS_OF_USE, user.schoolId, dateOfTermsOfUseConsent),
		]);

		privacy = getRelevantConsentVersions(privacy);
		termsOfUse = getRelevantConsentVersions(termsOfUse);

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
