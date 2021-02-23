let createdDatasourceIds = [];
const { datasourceModel } = require('../../../../src/services/datasources/model');

const createTestDatasource = (appPromise, opt) => async ({
	name = 'testDatasource',
	schoolId = opt.schoolId,
	config = {},
	// manual cleanup, e.g. when testing delete:
	manualCleanup = false,
} = {}) => {
	const app = await appPromise;
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

const cleanup = () => {
	if (createdDatasourceIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdDatasourceIds;
	createdDatasourceIds = [];
	return datasourceModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: createTestDatasource(app, opt),
	cleanup,
	info: createdDatasourceIds,
});
