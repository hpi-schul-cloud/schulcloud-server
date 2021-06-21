let createdVersionIds = [];

const createTestConsentVersion =
	(appPromise) =>
	async ({
		consentTypes = ['privacy', 'termsOfUse'],
		consentText = 'This is a test consent',
		consentDataId = undefined,
		schoolId = undefined,
		publishedAt = new Date(),
		title = 'test consent',
		manualCleanup = false,
	} = {}) => {
		const app = await appPromise;
		const version = await app.service('/consentVersionsModel').create({
			consentTypes,
			consentText,
			consentDataId,
			schoolId,
			publishedAt,
			title,
		});
		if (!manualCleanup) {
			createdVersionIds.push(version._id.toString());
		}
		return version;
	};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdVersionIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdVersionIds;
	createdVersionIds = [];
	const promises = ids.map((id) => app.service('/consentVersionsModel').remove(id));
	await Promise.all(promises);
};

module.exports = (app, opt) => ({
	create: createTestConsentVersion(app, opt),
	cleanup: cleanup(app),
	info: createdVersionIds,
});
