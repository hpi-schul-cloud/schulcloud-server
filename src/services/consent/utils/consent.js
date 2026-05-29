const { Configuration } = require('@hpi-schul-cloud/commons');

const checkParentConsent = (parentConsents) => {
	if (!parentConsents) return false;
	const agrements = parentConsents.filter((consent) => consent.privacyConsent && consent.termsOfUseConsent);
	if (parentConsents.length !== 0 && agrements.length === parentConsents.length) {
		return true;
	}

	return false;
};

const checkUserConsent = (userConsent) => userConsent && userConsent.privacyConsent && userConsent.termsOfUseConsent;

/**
 * Calculate the consent status
 * @param {Date} birthday
 * @param {Object} consent
 */
const defineConsentStatus = (birthday, consent) => {
	if (!consent) {
		return 'missing';
	}

	if (!birthday) {
		if (checkUserConsent(consent.userConsent) === true) {
			return 'ok';
		}
		return 'unknown';
	}

	const currentDate = new Date();
	const secondConsentSwitchDate = new Date();
	secondConsentSwitchDate.setFullYear(currentDate.getFullYear() - Configuration.get('CONSENT_AGE_SECOND'));
	const firstConsentSwitchDate = new Date();
	firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - Configuration.get('CONSENT_AGE_FIRST'));

	const { parentConsents, userConsent } = consent;

	if (birthday.getTime() > firstConsentSwitchDate.getTime()) {
		// only parents have to agree
		if (checkParentConsent(parentConsents) === true) {
			return 'ok';
		}
	} else if (birthday.getTime() <= secondConsentSwitchDate.getTime()) {
		// only user has to agree
		if (checkUserConsent(userConsent) === true) {
			return 'ok';
		}
	} else if (checkParentConsent(parentConsents)) {
		if (checkUserConsent(userConsent) === true) {
			return 'ok';
		}
		return 'parentsAgreed';
	}

	return 'missing';
};

/**
 * Calclulate if parent Consent is required
 * @param {Date} birthday
 * @returns {boolean}
 */
const isParentConsentRequired = (birthday) => {
	if (!(birthday instanceof Date)) return undefined;
	const currentDate = new Date();
	const secondConsentSwitchDate = new Date();
	secondConsentSwitchDate.setFullYear(currentDate.getFullYear() - Configuration.get('CONSENT_AGE_SECOND'));

	if (birthday.getTime() <= secondConsentSwitchDate.getTime()) {
		return false;
	}

	return true;
};

/**
 * Creates a consent object, how it looked before it moved to users model
 * @param {*} user
 */
const userToConsent = (user) => ({
	_id: user._id,
	userId: user._id,
	requiresParentConsent: isParentConsentRequired(user.birthday),
	consentStatus: defineConsentStatus(user.birthday, user.consent),
	...user.consent,
});

/**
 * data will be moved to the attribute consent
 * @param {Object} data
 */
// eslint-disable-next-line no-unused-vars
const modifyDataForUserSchema = ({ _id, userId, ...data }) => ({
	consent: {
		...data,
	},
});

module.exports = {
	defineConsentStatus,
	isParentConsentRequired,
	userToConsent,
	modifyDataForUserSchema,
};
