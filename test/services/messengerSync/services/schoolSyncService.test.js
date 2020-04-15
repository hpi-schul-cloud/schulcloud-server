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
			delete require.cache[
				require.resolve('../../../../src/services/messengerSync/services/schoolSyncService.js')
			];
			// eslint-disable-next-line global-require
			const messengerSync = require('../../../../src/services/messengerSync');
			app.configure(messengerSync);
		});

		after(async () => {
			mockery.deregisterAll();
			mockery.disable();
			// eslint-disable-next-line global-require
			const messengerSync = require('../../../../src/services/messengerSync');
			app.configure(messengerSync);
			Configuration.parse(configBefore);
		});

		it('admin can trigger a schoolSync', async () => {
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const users = await Promise.all([
				testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
				testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
				testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
			]);
			const params = await testObjects.generateRequestParamsFromUser(users[0]);
			params.route = { schoolId: school._id.toString() };
			await app.service('schools/:schoolId/messengerSync').create({}, params);

			const testingQueue = rabbitmqMock.queues.matrix_sync_unpopulated;
			expect(testingQueue).to.not.be.undefined;
			expect(testingQueue.length).to.equal(3);

			const firstMessage = JSON.parse(testingQueue[0]);
			expect(users.map((u) => u._id.toString()).includes(firstMessage.userId)).to.be.true;
			expect(firstMessage.fullSync).to.be.true;
			rabbitmqMock.reset();
		});
	});
});
