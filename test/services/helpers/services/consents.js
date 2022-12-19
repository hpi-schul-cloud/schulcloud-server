let createdConsentIds = [];

const createTestConsent = (appPromise) => async ({
	userId = undefined,
	userConsent = undefined,
	parentConsents = [],
	manualCleanup = false,
} = {}) => {
	const app = await appPromise;
	const consent = await app.service('consents').create({
		userId,
		userConsent,
		parentConsents,
	});
	if (!manualCleanup) {
		createdConsentIds.push(consent._id.toString());
	}
	return consent;
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
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
