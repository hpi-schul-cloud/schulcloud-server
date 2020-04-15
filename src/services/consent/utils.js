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
	userToConsent,
	modifyDataForUserSchema,
};
