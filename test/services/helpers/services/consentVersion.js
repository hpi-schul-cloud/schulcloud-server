let createdVersionIds = [];

const createTestConsentVersion = (app) => ({
	consentTypes = ['privacy', 'termsOfUse'],
	consentText = 'This is a test consent',
	consentDataId = undefined,
	schoolId = undefined,
	publishedAt = new Date(),
	title = 'test consent',
	manualCleanup = false,
} = {}) => app.service('/consentVersionsModel').create({
	consentTypes,
	consentText,
	consentDataId,
	schoolId,
	publishedAt,
	title,
}).then((version) => {
	if (!manualCleanup) {
		createdVersionIds.push(version._id.toString());
	}
	return version;
});

const cleanup = (app) => () => {
	if (createdVersionIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdVersionIds;
	createdVersionIds = [];
	return ids.map((id) => app.service('/consentVersionsModel').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestConsentVersion(app, opt),
	cleanup: cleanup(app),
	info: createdVersionIds,
});
