let createdBase64FileIds = [];

const createTestBase64File =
	(appPromise, opt) =>
	async ({
		data = 'data:application/pdf;base64,AAAAA',
		schoolId = opt.schoolId,
		filetype = 'pdf',
		filename = 'This is a test base64 file',
		publishedAt = new Date(),
		manualCleanup = false,
	} = {}) => {
		const app = await appPromise;
		const file = await app.service('base64Files').create({
			data,
			schoolId,
			filetype,
			filename,
			publishedAt,
		});
		if (!manualCleanup) {
			createdBase64FileIds.push(file._id.toString());
		}
		return file;
	};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdBase64FileIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdBase64FileIds;
	createdBase64FileIds = [];
	const promises = ids.map((id) => app.service('base64Files').remove(id));
	await Promise.all(promises);
};

module.exports = (app, opt) => ({
	create: createTestBase64File(app, opt),
	cleanup: cleanup(app),
	info: createdBase64FileIds,
});
