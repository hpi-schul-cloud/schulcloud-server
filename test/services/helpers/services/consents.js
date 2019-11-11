let createdConsentIds = [];

const createTestConsent = (app, opt) => ({
	userId = undefined,
	userConsent = undefined,
	parentConsents = [],
	manualCleanup = false,
} = {}) => app.service('consents').create({
	userId,
	userConsent,
	parentConsents,
}).then((consent) => {
	if (!manualCleanup) {
		createdConsentIds.push(consent._id.toString());
	}
	return consent;
});

const cleanup = (app) => () => {
	const ids = createdConsentIds;
	createdConsentIds = [];
	return ids.map((id) => app.service('consents').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestConsent(app, opt),
	cleanup: cleanup(app),
	info: createdConsentIds,
});
