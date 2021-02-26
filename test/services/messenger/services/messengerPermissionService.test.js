const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');

describe('MessengerPermissionService', function test() {
	this.timeout(300000);
	let configBefore;
	let app;
	let server;
	let testObjects;

	describe('if Matrix messenger and student room creation is enabled', async () => {
		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
			Configuration.set('MATRIX_MESSENGER__STUDENT_ROOM_CREATION', true);
			delete require.cache[require.resolve('../../../../src/app')];
			// eslint-disable-next-line global-require
			app = await require('../../../../src/app');
			// eslint-disable-next-line global-require
			testObjects = require('../../helpers/testObjects')(app);
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.parse(configBefore);
			await testObjects.cleanup();
			await server.close();
		});

		it('administrators have messenger permission to open one to one chats', async () => {
			const school = await testObjects.createTestSchool();
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(adminUser._id, {});
			expect(result.createRoom).to.be.true;
		});

		it('teachers have messenger permission to open one to one chats', async () => {
			const school = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(teacher._id);
			expect(result.createRoom).to.be.true;
		});

		it('students do not have messenger permission to open one to one chats by default', async () => {
			const school = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.false;
		});

		it('students have messenger permission to open one to one chats if school setting is set', async () => {
			const school = await testObjects.createTestSchool({ features: ['messengerStudentRoomCreate'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.true;
		});
	});

	describe('if Matrix messenger is enabled and student room creation is disabled', async () => {
		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
			Configuration.set('MATRIX_MESSENGER__STUDENT_ROOM_CREATION', false);
			delete require.cache[require.resolve('../../../../src/app')];
			// eslint-disable-next-line global-require
			app = await require('../../../../src/app');
			// eslint-disable-next-line global-require
			testObjects = require('../../helpers/testObjects')(app);
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.parse(configBefore);
			await testObjects.cleanup();
			await server.close();
		});

		it('administrators have messenger permission to open one to one chats', async () => {
			const school = await testObjects.createTestSchool();
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(adminUser._id);
			expect(result.createRoom).to.be.true;
		});

		it('teachers have messenger permission to open one to one chats', async () => {
			const school = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(teacher._id);
			expect(result.createRoom).to.be.true;
		});

		it('students do not have messenger permission to open one to one chats', async () => {
			const school = await testObjects.createTestSchool({ features: ['messengerStudentRoomCreate'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.false;
		});
	});

	describe('if Matrix messenger is disabled', () => {
		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', false);
			delete require.cache[require.resolve('../../../../src/app')];
			// eslint-disable-next-line global-require
			app = await require('../../../../src/app');
			// eslint-disable-next-line global-require
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.parse(configBefore);
			await server.close();
		});

		it('the service is not exposed', async () => {
			expect(app.service('/messengerPermissions')).to.be.undefined;
		});
	});
});
