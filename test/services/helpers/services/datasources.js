let createdDatasourceIds = [];

const createTestDatasource = (app, opt) => async ({
	name = 'testDatasource',
	schoolId = opt.schoolId,
	config = {},
	// manual cleanup, e.g. when testing delete:
	manualCleanup = false,
} = {}) => {
	if (!config.target) {
		throw new Error('datasource requires a config with a target! No the testobjects cant do that for you...');
	}
	const datasource = await app.service('datasources').create({
		schoolId,
		config,
		name,
	});
	if (!manualCleanup) {
		createdDatasourceIds.push(datasource._id.toString());
	}
	return datasource;
};

const cleanup = (app) => () => {
	const ids = createdDatasourceIds;
	createdDatasourceIds = [];
	return ids.map((id) => app.service('datasources').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestDatasource(app, opt),
	cleanup: cleanup(app),
	info: createdDatasourceIds,
});
