const mockery = require('mockery');
const commons = require('@schul-cloud/commons');
const rabbitmqMock = require('./rabbitmqMock');
const { ACTIONS } = require('../../../src/services/messengerSync/producer');

const { Configuration } = commons;

describe('service', function test() {
	this.timeout(20000); // give require app enough time
	let configBefore;
	let server;
	let app;
	let testObjects;

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
		mockery.registerMock('amqplib', rabbitmqMock.amqplib);

		// eslint-disable-next-line global-require
		app = await require('../../../src/app');
		// eslint-disable-next-line global-require
		testObjects = require('../helpers/testObjects')(app);
		server = await app.listen(0);
	});

	after((done) => {
		rabbitmqMock.reset();

		Configuration.parse(configBefore);
		mockery.deregisterAll();
		mockery.disable();

		server.close(done);
		testObjects.cleanup();
	});

	it('reject invalid messages', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		const users = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
		]);

		let msg = {};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject

		msg = {
			action: 'invalid',
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject

		msg = {
			action: ACTIONS.SYNC_SCHOOL,
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (schoolId)

		msg = {
			action: ACTIONS.SYNC_SCHOOL,
			schoolId: 'invalid',
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (schoolId)

		msg = {
			action: ACTIONS.SYNC_SCHOOL,
			schoolId: school._id,
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (fullSync)

		msg = {
			action: ACTIONS.SYNC_USER,
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (userId)

		msg = {
			action: ACTIONS.SYNC_USER,
			userId: 'invalid',
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (userId)

		msg = {
			action: ACTIONS.SYNC_USER,
			userId: users[0]._id,
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		// > reject (what)
	});

	it('sync school', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
		]);

		const msg = {
			action: ACTIONS.SYNC_SCHOOL,
			schoolId: school._id,
			fullSync: true,
		};
		rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
	});

	it('sync user', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		const users = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
			testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
		]);

		const msg = {
			action: ACTIONS.SYNC_USER,
			userId: users[0]._id,
			fullSync: true,
		};
		await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
	});
});
