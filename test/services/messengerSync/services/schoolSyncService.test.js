const { expect } = require('chai');
const commons = require('@schul-cloud/commons');

const mockery = require('mockery');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const rabbitmqMock = require('../rabbitmqMock');

// const schoolSyncService = app.service('schools/:schoolId/messengerSync');
const { Configuration } = commons;


describe('messenger schoolSync Service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
		testObjects.cleanup();
	});

	describe('with rabbitMQ enabled', () => {
		let configBefore;

		before(async () => {
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
			const messengerSync = require('../../../../src/services/messengerSync');
			app.configure(messengerSync);
		});

		after(async () => {
			Configuration.parse(configBefore);
			mockery.deregisterAll();
			mockery.disable();
			// eslint-disable-next-line global-require
			const messengerSync = require('../../../../src/services/messengerSync');
			app.configure(messengerSync);
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
});
