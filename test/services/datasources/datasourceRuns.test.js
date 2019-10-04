const { expect } = require('chai');
const mockery = require('mockery');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const { datasourceRunModel } = require('../../../src/services/datasources/model');
const Syncer = require('../../../src/services/sync/strategies/Syncer');

const datasourcesService = app.service('datasources');
const datasourceRunsService = app.service('datasourceRuns');

/**
 * will always run successfully
 */
class MockSyncer extends Syncer {
	static respondsTo(target) {
		return target === 'mock';
	}

	static params(params, data) {
		return [true];
	}
}

/**
 * will only successfully run if data is provided
 */
class MockSyncerWithData extends Syncer {
	static respondsTo(target) {
		return target === 'mockwithdata';
	}

	static params(params, data) {
		if (data) return [true];
		return false;
	}
}

describe.only('datasourceRuns service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
		mockery.enable({
			warnOnUnregistered: false,
		});
		mockery.registerMock('./strategies', [MockSyncer, MockSyncerWithData]);
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

	it('CREATE starts a datasource run without data', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await datasourcesService.create({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'cool datasource',
		});
		const result = await datasourceRunsService.create({ datasourceId: datasource._id });
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');
		expect(typeof result.log).to.equal('string');
		expect(result.datasourceId.toString()).to.equal(datasource._id.toString());

		await datasourceRunModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('CREATE starts a datasource run with data', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await datasourcesService.create({
			schoolId: testSchool._id,
			config: { target: 'mockwithdata' },
			name: 'datahungry source',
		});
		const result = await datasourceRunsService.create({ datasourceId: datasource._id, data: 'datakraken-food' });
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');
		expect(typeof result.log).to.equal('string');
		expect(result.datasourceId.toString()).to.equal(datasource._id.toString());

		await datasourceRunModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('CREATE works for an authorized user', async () => {
		const school = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await datasourcesService.create({
			schoolId: school._id,
			config: { target: 'mock' },
			name: 'datahungry source',
		});
		const params = await generateRequestParamsFromUser(user);
		const result = await datasourceRunsService.create(
			{ datasourceId: datasource._id.toString() },
			params,
		);
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');
		expect(typeof result.log).to.equal('string');
		expect(result.datasourceId.toString()).to.equal(datasource._id.toString());

		await datasourceRunModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('CREATE fails for a different school', async () => {
		try {
			const userSchool = await testObjects.createTestSchool();
			const datasourceSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchool._id });
			const datasource = await datasourcesService.create({
				schoolId: datasourceSchool._id,
				config: { target: 'mockwithdata' },
				name: 'datahungry source',
			});
			const params = await generateRequestParamsFromUser(user);
			await datasourceRunsService.create(
				{ datasourceId: datasource._id.toString(), data: 'datakraken-food' },
				params,
			);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.className).to.equal('forbidden');
		}
	});

	it('GET fetches a run including log', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await datasourcesService.create({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'awesome datasource',
		});
		const datasourceRun = await datasourceRunsService.create({ datasourceId: datasource._id });
		const result = await datasourceRunsService.get(datasourceRun._id);
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');
		expect(typeof result.log).to.equal('string');
		expect(result.datasourceId.toString()).to.equal(datasource._id.toString());

		await datasourceRunModel.deleteOne({ _id: result._id }).lean().exec();
	});

	it('GET fails for a different school', async () => {
		try {
			const userSchool = await testObjects.createTestSchool();
			const datasourceSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchool._id });
			const datasource = await datasourcesService.create({
				schoolId: datasourceSchool._id,
				config: { target: 'mockwithdata' },
				name: 'datahungry source',
			});
			const params = await generateRequestParamsFromUser(user);
			const dsrun = await datasourceRunsService
				.create({ datasourceId: datasource._id.toString(), data: 'datakraken-food' });
			await datasourceRunsService.get(dsrun._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.className).to.equal('forbidden');
		}
	});

	it('FIND fetches all runs for a datasource', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await datasourcesService.create({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'beautiful datasource',
		});
		const datasourceRunIds = (await Promise.all([
			datasourceRunsService.create({ datasourceId: datasource._id }),
			datasourceRunsService.create({ datasourceId: datasource._id }),
			datasourceRunsService.create({ datasourceId: datasource._id }),
		])).map(ds => ds._id.toString());
		const result = await datasourceRunsService.find({ datasourceId: datasource._id });
		expect(result).to.not.equal(undefined);
		result.forEach((res) => {
			expect(res.status).to.equal('Success');
			expect(res.log).to.not.exist;
			expect(datasourceRunIds.includes(res._id.toString())).to.equal(true);
		});
		await datasourceRunModel.remove({ _id: { $in: datasourceRunIds } }).lean().exec();
	});

	it('FIND fetches all runs for a school');

	it('FIND can be sorted');

	it('FIND can be paginated');

	it('FIND doesnt include filtered results');

	it('FIND cant fetch runs from a different school');
});
