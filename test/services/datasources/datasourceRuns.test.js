/* eslint-disable max-classes-per-file */
const { expect } = require('chai');
const sleep = require('util').promisify(setTimeout);
const appPromise = require('../../../src/app');
const testHelper = require('../helpers/testObjects');
const loginTestHelper = require('../helpers/services/login');
const { datasourceRunModel } = require('../../../src/services/datasources/model');
const Syncer = require('../../../src/services/sync/strategies/Syncer');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

/**
 * will always run successfully
 */
class MockSyncer extends Syncer {
	static respondsTo(target) {
		return target === 'mock';
	}

	// eslint-disable-next-line no-unused-vars
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

describe('datasourceRuns service', () => {
	let app;
	let datasourceRunsService;
	let server;
	let nestServices;
	let testObjects;
	let generateRequestParamsFromUser;
	let datasourceRunIds;

	before(async () => {
		app = await appPromise();
		testObjects = testHelper(app);
		({ generateRequestParamsFromUser } = loginTestHelper(app));

		nestServices = await setupNestServices(app);

		// override registered strategies
		app.set('syncersStrategies', [MockSyncer, MockSyncerWithData]);
		datasourceRunsService = app.service('datasourceRuns');

		app.unuse('/sync/userAccount');

		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		if (!datasourceRunIds) {
			await datasourceRunModel
				.remove({ _id: { $in: datasourceRunIds } })
				.lean()
				.exec();
			datasourceRunIds = undefined;
		}
	});

	it('registered the datasourceRuns service', () => {
		expect(datasourceRunsService).to.not.equal(undefined);
	});

	it('CREATE starts a datasource run without data', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'cool datasource',
		});
		const result = await datasourceRunsService.create({ datasourceId: datasource._id });
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Pending');
	});

	it('CREATE handles errors in syncer', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'errormock' },
			name: 'cool datasource',
		});

		const result = await datasourceRunsService.create({ datasourceId: datasource._id });
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Pending');

		await sleep(250);

		const updatedRun = await datasourceRunsService.get(datasourceRunIds[0]);
		expect(updatedRun.status).to.equal('Error');
	});

	it('CREATE starts a datasource run with data', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mockwithdata' },
			name: 'datahungry source',
		});
		const result = await datasourceRunsService.create({
			datasourceId: datasource._id,
			data: { key: 'datakraken-food' },
		});
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Pending');
	});

	it('CREATE updates the datasource and datasourcerun once its done.', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'lastrun datasource',
		});
		const beforeRun = Date.now();
		const run = await datasourceRunsService.create({ datasourceId: datasource._id });
		datasourceRunIds = [run._id];
		await sleep(50);
		const updatedRun = await datasourceRunsService.get(run._id);
		expect(updatedRun.status).to.equal('Success');
		const updatedDatasource = await app.service('datasources').get(datasource._id);
		expect(updatedDatasource).to.not.equal(undefined);
		expect(updatedDatasource.lastRun.getTime()).to.be.greaterThan(beforeRun);
		expect(updatedDatasource.lastStatus).to.equal(updatedRun.status);
	});

	it('CREATE works for an authorized user', async () => {
		const school = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: school._id,
			config: { target: 'mock' },
			name: 'datahungry source',
		});
		const params = await generateRequestParamsFromUser(user);
		const result = await datasourceRunsService.create({ datasourceId: datasource._id.toString() }, params);
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Pending');
	});

	it('CREATE fails for a different school', async () => {
		try {
			const userSchool = await testObjects.createTestSchool();
			const datasourceSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchool._id });
			const datasource = await testObjects.createTestDatasource({
				schoolId: datasourceSchool._id,
				config: { target: 'mockwithdata' },
				name: 'datahungry source',
			});
			const params = await generateRequestParamsFromUser(user);
			const result = await datasourceRunsService.create(
				{ datasourceId: datasource._id.toString(), data: { plate: 'datakraken-food' } },
				params
			);
			datasourceRunIds = [result._id];

			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.className).to.equal('forbidden');
		}
	});

	it('Superhero can start Run on any school', async () => {
		const userSchool = await testObjects.createTestSchool();
		const datasourceSchool = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: userSchool._id });
		const datasource = await testObjects.createTestDatasource({
			schoolId: datasourceSchool._id,
			config: { target: 'mock' },
			name: 'superheroes source',
		});
		const params = await generateRequestParamsFromUser(user);
		const result = await datasourceRunsService.create({ datasourceId: datasource._id.toString() }, params);
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Pending');
	});

	it('GET fetches a run including log', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'awesome datasource',
		});
		const datasourceRun = await datasourceRunsService.create({ datasourceId: datasource._id });
		await sleep(50);
		const result = await datasourceRunsService.get(datasourceRun._id);
		datasourceRunIds = [result._id];
		expect(result).to.not.equal(undefined);
		expect(result.status).to.equal('Success');
		expect(typeof result.log).to.equal('string');
		expect(result.datasourceId.toString()).to.equal(datasource._id.toString());
	});

	it('GET fails for a different school', async () => {
		let datasourceRun;
		try {
			const userSchool = await testObjects.createTestSchool();
			const datasourceSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchool._id });
			const datasource = await testObjects.createTestDatasource({
				schoolId: datasourceSchool._id,
				config: { target: 'mockwithdata' },
				name: 'datahungry source',
			});
			const params = await generateRequestParamsFromUser(user);
			datasourceRun = await datasourceRunsService.create({
				datasourceId: datasource._id.toString(),
				data: { payload: 'datakraken-food' },
			});
			datasourceRunIds = [datasourceRun._id];
			await datasourceRunsService.get(datasourceRun._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.className).to.equal('forbidden');
		}
	});

	it('FIND fetches all runs for a datasource', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'beautiful datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: datasource._id }),
			])
		).map((ds) => ds._id.toString());
		const result = await datasourceRunsService.find({ query: { datasourceId: datasource._id } });
		expect(result).to.not.equal(undefined);
		result.data.forEach((res) => {
			expect(res.status).to.not.equal(undefined);
			expect(res.log).to.equal(undefined);
			expect(datasourceRunIds.includes(res._id.toString())).to.equal(true);
		});
	});

	it('FIND fetches all runs for a school', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'first datasource',
		});
		const otherDatasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'second datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: otherDatasource._id }),
			])
		).map((ds) => ds._id.toString());
		const result = await datasourceRunsService.find({ query: { schoolId: testSchool._id } });
		expect(result).to.not.equal(undefined);
		result.data.forEach((res) => {
			expect(res.status).to.not.equal(undefined);
			expect(res.log).to.equal(undefined);
			expect(datasourceRunIds.includes(res._id.toString())).to.equal(true);
		});
	});

	it('FIND can be sorted', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'first datasource',
		});
		const otherDatasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'second datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: otherDatasource._id }),
			])
		).map((ds) => ds._id.toString());
		const ascResult = await datasourceRunsService.find({ query: { schoolId: testSchool._id, sort: '_id' } });
		const descResult = await datasourceRunsService.find({ query: { schoolId: testSchool._id, sort: '-_id' } });
		expect(ascResult).to.not.equal(undefined);
		expect(ascResult.total).to.equal(2);
		expect(descResult).to.not.equal(undefined);
		expect(descResult.total).to.equal(2);
		expect(ascResult.data[0]._id.toString()).to.equal(descResult.data[1]._id.toString());
		expect(ascResult.data[1]._id.toString()).to.equal(descResult.data[0]._id.toString());
	});

	it('FIND can be paginated', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'first datasource',
		});
		const otherDatasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'second datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: otherDatasource._id }),
			])
		).map((ds) => ds._id.toString());
		const result = await datasourceRunsService.find({ query: { schoolId: testSchool._id, $skip: 1, $limit: 1 } });
		expect(result).to.not.equal(undefined);
		expect(result.skip).to.equal(1);
		expect(result.limit).to.equal(1);
		expect(Array.isArray(result.data)).to.equal(true);
		expect(result.data.length).to.equal(1);
	});

	it('FIND doesnt include filtered results', async () => {
		const testSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'correct datasource',
		});
		const otherDatasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'other datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: otherDatasource._id }),
			])
		).map((ds) => ds._id.toString());
		const result = await datasourceRunsService.find({ query: { datasourceId: datasource._id } });
		expect(result).to.not.equal(undefined);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(datasourceRunIds[0].toString());
	});

	it('FIND cant fetch runs from a different school', async () => {
		const testSchool = await testObjects.createTestSchool();
		const otherSchool = await testObjects.createTestSchool();
		const datasource = await testObjects.createTestDatasource({
			schoolId: testSchool._id,
			config: { target: 'mock' },
			name: 'correct datasource',
		});
		const otherDatasource = await testObjects.createTestDatasource({
			schoolId: otherSchool._id,
			config: { target: 'mock' },
			name: 'other datasource',
		});
		datasourceRunIds = (
			await Promise.all([
				datasourceRunsService.create({ datasourceId: datasource._id }),
				datasourceRunsService.create({ datasourceId: otherDatasource._id }),
			])
		).map((ds) => ds._id.toString());
		const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: testSchool._id });
		const params = await generateRequestParamsFromUser(user);
		const result = await datasourceRunsService.find(params);
		expect(result).to.not.equal(undefined);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(datasourceRunIds[0].toString());
	});
});
