const addDates = (context) => {
	if (context.data.consent) {
		const { parentConsents, userConsent } = context.data.consent;
		if (
			parentConsents &&
			parentConsents.length &&
			parentConsents.length !== 0 &&
			typeof parentConsents[0] === 'object'
		) {
			const parentConsent = parentConsents[0];
			if ('privacyConsent' in parentConsent && !('dateOfPrivacyConsent' in parentConsent)) {
				parentConsent.dateOfPrivacyConsent = Date.now();
			}
			if ('termsOfUseConsent' in parentConsent && !('dateOftermsOfUseConsent' in parentConsent)) {
				parentConsent.dateOfTermsOfUseConsent = Date.now();
			}
		}
		if (typeof userConsent === 'object') {
			if ('privacyConsent' in userConsent && !('dateOfPrivacyConsent' in userConsent)) {
				userConsent.dateOfPrivacyConsent = Date.now();
			}
			if ('termsOfUseConsent' in userConsent && !('dateOfTermsOfUseConsent' in userConsent)) {
				userConsent.dateOfTermsOfUseConsent = Date.now();
			}
		}
	}

	return context;
};

module.exports = {
	addDates,
};
