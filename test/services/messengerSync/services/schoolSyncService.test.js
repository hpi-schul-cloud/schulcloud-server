const { expect } = require('chai');
const mockery = require('mockery');
const commons = require('@schul-cloud/commons');
const rabbitmqMock = require('../rabbitmqMock');

const { Configuration } = commons;

describe('service', function test() {
	this.timeout(10000); // give require app enough time
	let configBefore;
	let server;
	let app;
	let testObjects;

	before((done) => {
		configBefore = Configuration.toObject(); // deep copy current config
		Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
		Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('@schul-cloud/commons', commons);
		mockery.registerMock('../../../utils/rabbitmq', rabbitmqMock);
		mockery.registerMock('../../utils/rabbitmq', rabbitmqMock);

		// eslint-disable-next-line global-require
		app = require('../../../../src/app');
		// eslint-disable-next-line global-require
		testObjects = require('../../helpers/testObjects')(app);
		server = app.listen(0, done);
	});

	after((done) => {
		Configuration.parse(configBefore);
		mockery.deregisterAll();
		mockery.disable();

		server.close(done);
		testObjects.cleanup();
	});

	it('admin can trigger a schoolSync', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		const users = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
		]);
		const testingQueue = rabbitmqMock.queues.matrix_sync_unpopulated;
		expect(testingQueue).to.not.be.undefined;
		expect(testingQueue.length, '3 user creation events + 1 school creation event').to.equal(4);

		const params = await testObjects.generateRequestParamsFromUser(users[0]);
		params.route = { schoolId: school._id.toString() };
		await app.service('schools/:schoolId/messengerSync').create({}, params);

		expect(testingQueue.length, '4 + 1 request school sync').to.equal(5);

		const lastMessage = JSON.parse(testingQueue[4]);
		expect(lastMessage.schoolId).to.equal(school._id.toString());
		expect(lastMessage.fullSync).to.be.true;
		rabbitmqMock.reset();
	});

	it('do not trigger without feature flag schoolSync', async () => {
		const school = await testObjects.createTestSchool({ features: [] });
		const users = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
		]);
		const testingQueue = rabbitmqMock.queues.matrix_sync_unpopulated;
		expect(testingQueue).to.not.be.undefined;
		expect(testingQueue.length, '3 user creation events + 1 school creation event').to.equal(4);

		const params = await testObjects.generateRequestParamsFromUser(users[0]);
		params.route = { schoolId: school._id.toString() };
		await app.service('schools/:schoolId/messengerSync')
			.create({}, params)
			.catch((err) => {
				expect(err.code).to.be.equal(400);
			});

		expect(testingQueue.length, 'no new event').to.equal(4);

		rabbitmqMock.reset();
	});
});
