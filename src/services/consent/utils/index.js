/**
 * Converts consentStatus to a filter condition for consent
 * @param  {...string} status
 */
const createConsentFilterQuery = (...status) => {
	const currentDate = new Date();
	const secondConsentSwitchDate = new Date();
	secondConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstConsentSwitchDate = new Date();
	firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - 14);

	const createRequiredConsents = (...persons) =>
		persons.reduce((person, current) => {
			current[`consent.${person}.privacyConsent`] = true;
			current[`consent.${person}.termsOfUseConsent`] = true;

			return current;
		}, {});

	const createMissingConsents = (...persons) =>
		persons.reduce(
			(person, current) => {
				current.$or.push({
					[`consent.${person}.privacyConsent`]: true,
				});
				current.$or.push({
					[`consent.${person}.termsOfUseConsent`]: true,
				});

				return current;
			},
			{ $or: [] },
		);

	const orConditions = status.reduce((query, stat) => {
		if (stat === 'missing') {
			query.push({
				...createMissingConsents('userConsent'),
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				...createMissingConsents('parentConsents'),
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				...createMissingConsents('parentConsents'),
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		} else if (stat === 'parentAgree') {
			query.push({
				...createRequiredConsents('parentConsents'),
				...createMissingConsents('userConsent'),
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
		} else if (stat === 'ok') {
			query.push({
				...createRequiredConsents('userConsent'),
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				...createRequiredConsents('userConsent', 'parentConsents'),
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				...createRequiredConsents('parentConsents'),
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		}
		return query;
	}, []);

	return {
		$or: orConditions,
	};
};

/**
 * Creates a consent object, how it looked before it moved to users model
 * @param {*} user
 */
const userToConsent = (user) => ({
	_id: user._id,
	userId: user._id,
	requiresParentConsent: user.requiresParentConsent,
	consentStatus: user.consentStatus,
	...user.consent,
});

/**
 * data will be moved to the attribute consent
 * @param {Object} data
 */
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
