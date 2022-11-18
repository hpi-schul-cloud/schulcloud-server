const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const rabbitmqMock = require('../rabbitmqMock');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('schoolSyncService', () => {
	let configBefore;
	let server;
	let app;
	let nestServices;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);

		const appPromise = rabbitmqMock.setupMock();
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = await app.listen(0);
		// eslint-disable-next-line global-require
		testObjects = require('../../helpers/testObjects')(appPromise());

		rabbitmqMock.reset();
	});

	after(async () => {
		Configuration.reset(configBefore);
		rabbitmqMock.closeMock();
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
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

		const lastMessage = testingQueue[4];
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
		await app
			.service('schools/:schoolId/messengerSync')
			.create({}, params)
			.catch((err) => {
				expect(err.code).to.be.equal(400);
			});

		expect(testingQueue.length, 'no new event').to.equal(4);

		rabbitmqMock.reset();
	});
});
