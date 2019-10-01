const { expect } = require('chai');
const mockery = require('mockery');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const { datasourceRunModel } = require('../../../src/services/datasources/model');
const Syncer = require('../../../src/services/sync/strategies/Syncer');

const datasourcesService = app.service('datasources');
const datasourceRunsService = app.service('datasourceRuns');

class MockSyncer extends Syncer {
	static respondsTo(target) {
		return target === 'mock';
	}

	static params(params, data) {
		return [true];
	}
}

describe.only('datasourceRuns service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
		mockery.enable({
			warnOnUnregistered: false,
		});
		mockery.registerMock('./strategies', [MockSyncer]);
		delete require.cache[require.resolve('../../../src/services/sync/index.js')];
		// eslint-disable-next-line global-require
		const sync = require('../../../src/services/sync');
		app.configure(sync);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the datasourceRuns service', () => {
		expect(datasourceRunsService).to.not.be.undefined;
	});

	it('starts a datasource run', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await datasourcesService.create({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'cool datasource',
		});
		const result = await datasourceRunsService.create({ datasourceId: datasource._id });
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');

		await datasourceRunModel.deleteOne({ _id: result._id }).lean().exec();
	});
});
