let createdSystemIds = [];

const createTestSystem = app => ({ url, type = 'moodle' }) => {
	return app.service('systems').create({ url, type })
		.then((system) => {
			createdSystemIds.push(system._id.toString());
			return system;
		});
};

const cleanup = app => () => {
	const ids = createdSystemIds;
	createdSystemIds = [];
	return ids.map(id => app.service('systems').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestSystem(app),
	cleanup: cleanup(app),
	info: createdSystemIds,
});
