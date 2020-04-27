const createConsentFilterQuery = (...status) => {
	const currentDate = new Date();
	const secondConsentSwitchDate = new Date();
	secondConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstConsentSwitchDate = new Date();
	firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - 14);

	const requiredConsents = {
		privacyConsent: true,
		termsOfUseConsent: true,
	};

	const missingConsents = {
		$or: [
			{ privacyConsent: false },
			{ termsOfUseConsent: false },
		],
	};

	const orConditions = status.reduce((query, status) => {
		if (status === 'missing') {
			query.push({
				consent: {
					userConsent: missingConsents,
				},
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: missingConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: missingConsents,
				},
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		} else if (status === 'parentAgree') {
			query.push({
				consent: {
					userConsent: missingConsents,
					parentConsents: requiredConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
		} else if (status === 'ok') {
			query.push({
				consent: {
					userConsent: requiredConsents,
				},
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					userConsent: requiredConsents,
					parentConsents: requiredConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: requiredConsents,
				},
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		}
	}, []);

	return {
		$or: orConditions,
	};
};


const userToConsent = (user) => ({
	_id: user._id,
	userId: user._id,
	requiresParentConsent: user.requiresParentConsent,
	consentStatus: user.consentStatus,
	...user.consent,
});

const modifyDataForUserSchema = (data) => ({
	consent: {
		...data,
	},
});

module.exports = {
	createConsentFilterQuery,
	userToConsent,
	modifyDataForUserSchema,
};
