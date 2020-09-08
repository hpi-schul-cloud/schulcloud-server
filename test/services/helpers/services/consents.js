let createdConsentIds = [];

const createTestConsent = (app) => ({
	userId = undefined,
	userConsent = undefined,
	parentConsents = [],
	manualCleanup = false,
} = {}) =>
	app
		.service('consents')
		.create({
			userId,
			userConsent,
			parentConsents,
		})
		.then((consent) => {
			if (!manualCleanup) {
				createdConsentIds.push(consent._id.toString());
			}
			return consent;
		});

const cleanup = (app) => () => {
	if (createdConsentIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdConsentIds;
	createdConsentIds = [];
	return ids.map((id) => app.service('consents').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestConsent(app, opt),
	cleanup: cleanup(app),
	info: createdConsentIds,
});
