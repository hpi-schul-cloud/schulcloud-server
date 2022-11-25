const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { Configuration } = require('@hpi-schul-cloud/commons');
const rabbitmqMock = require('./rabbitmqMock');
const { ACTIONS } = require('../../../src/services/messengerSync/producer');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('consumerTest', () => {
	let configBefore;
	let server;
	let app;
	let nestServices;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
		Configuration.set('MATRIX_MESSENGER__SECRET', 'fake.secret');
		Configuration.set('MATRIX_MESSENGER__SERVERNAME', 'fake.server');

		const appPromise = rabbitmqMock.setupMock();
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = await app.listen(0);
		// eslint-disable-next-line global-require
		testObjects = require('../helpers/testObjects')(appPromise());
	});

	after(async () => {
		Configuration.reset(configBefore);
		rabbitmqMock.closeMock();

		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('reject invalid messages', async () => {
		let msg = {};
		let success;

		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject

		msg = {
			action: 'invalid',
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject

		// SYNC_SCHOOL
		msg = {
			action: ACTIONS.SYNC_SCHOOL,
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (schoolId)

		msg = {
			action: ACTIONS.SYNC_SCHOOL,
			schoolId: 'invalid',
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (schoolId)

		msg = {
			action: ACTIONS.SYNC_SCHOOL,
			schoolId: new ObjectId(),
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (fullSync)

		// SYNC_USER
		msg = {
			action: ACTIONS.SYNC_USER,
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (userId)

		msg = {
			action: ACTIONS.SYNC_USER,
			userId: 'invalid',
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (userId)

		msg = {
			action: ACTIONS.SYNC_USER,
			userId: new ObjectId(),
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (what)

		// DELETE_TEAM
		msg = {
			action: ACTIONS.DELETE_TEAM,
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (teamId)

		msg = {
			action: ACTIONS.DELETE_TEAM,
			teamId: 'invalid',
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (teamId)

		// DELETE_COURSE
		msg = {
			action: ACTIONS.DELETE_COURSE,
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (courseId)

		msg = {
			action: ACTIONS.DELETE_COURSE,
			courseId: 'invalid',
		};
		success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.false; // > reject (courseId)
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
		const queueName = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');

		const success = await rabbitmqMock.triggerConsume(queueName, msg);
		expect(success).to.be.true;

		// generated messages should be marked as school sync messages, so they can be downprioritized
		const generatedMessages = rabbitmqMock.queues[queueName].slice(-3);
		expect(generatedMessages).to.be.an('array').of.length(3);
		generatedMessages.forEach((message) => expect(message.schoolSync).to.be.true);
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
		const success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.true;
	});

	it('delete team', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		const { team } = await testObjects.createTestTeamWithOwner({ roles: ['teacher'], schoolId: school._id });

		const msg = {
			action: ACTIONS.DELETE_TEAM,
			teamId: team._id,
		};
		const success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.true;
	});

	it('delete course', async () => {
		const school = await testObjects.createTestSchool({ features: ['messenger'] });
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
		const course = await testObjects.createTestCourse({ teacherIds: [teacher._id], schoolId: school._id });

		const msg = {
			action: ACTIONS.DELETE_COURSE,
			courseId: course._id,
		};
		const success = await rabbitmqMock.triggerConsume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msg);
		expect(success).to.be.true;
	});
});
