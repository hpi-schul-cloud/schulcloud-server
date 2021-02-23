let createdSystemIds = [];

const createTestSystem = (appPromise) => async (options = { url: '', type: 'moodle' }) => {
	const app = await appPromise;
	const system = await app.service('systems').create(options);
	createdSystemIds.push(system._id.toString());
	return system;
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdSystemIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSystemIds;
	createdSystemIds = [];
	return ids.map((id) => app.service('systems').remove(id));
};

module.exports = (app) => ({
	create: createTestSystem(app),
	cleanup: cleanup(app),
	info: createdSystemIds,
});
