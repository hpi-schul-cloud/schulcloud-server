const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects');

describe('MessengerPermissionService', () => {
	describe('if Matrix messenger and student room creation is enabled', async () => {
		let configBefore;
		let app;
		let server;
		let testHelper;

		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true });
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
			Configuration.update({
				FEATURE_MATRIX_MESSENGER_ENABLED: true,
				MATRIX_MESSENGER: {
					SECRET: 'secret',
					STUDENT_ROOM_CREATION: true,
				},
			});

			app = await appPromise;
			server = await app.listen(0);
			testHelper = testObjects(app);
		});

		after(async () => {
			Configuration.parse(configBefore);
			await testHelper.cleanup();
			await server.close();
		});

		it('administrators have messenger permission to open one to one chats', async () => {
			const school = await testHelper.createTestSchool();
			const adminUser = await testHelper.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(adminUser._id, {});
			expect(result.createRoom).to.be.true;
		});

		it('teachers have messenger permission to open one to one chats', async () => {
			const school = await testHelper.createTestSchool();
			const teacher = await testHelper.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(teacher._id);
			expect(result.createRoom).to.be.true;
		});

		it('students do not have messenger permission to open one to one chats by default', async () => {
			const school = await testHelper.createTestSchool();
			const student = await testHelper.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.false;
		});

		it('students have messenger permission to open one to one chats if school setting is set', async () => {
			const school = await testHelper.createTestSchool({ features: ['messengerStudentRoomCreate'] });
			const student = await testHelper.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.true;
		});
	});

	describe('if Matrix messenger is enabled and student room creation is disabled', async () => {
		let configBefore;
		let app;
		let server;
		let testHelper;

		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
			Configuration.update({
				FEATURE_MATRIX_MESSENGER_ENABLED: true,
				MATRIX_MESSENGER: {
					SECRET: 'secret',
					STUDENT_ROOM_CREATION: false,
				},
			});

			app = await appPromise;
			server = await app.listen(0);
			testHelper = testObjects(app);
		});

		after(async () => {
			Configuration.parse(configBefore);
			await testHelper.cleanup();
			await server.close();
		});

		it.only('administrators have messenger permission to open one to one chats', async () => {
			const school = await testHelper.createTestSchool();
			const adminUser = await testHelper.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(adminUser._id);
			expect(result.createRoom).to.be.true;
		});

		it('teachers have messenger permission to open one to one chats', async () => {
			const school = await testHelper.createTestSchool();
			const teacher = await testHelper.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(teacher._id);
			expect(result.createRoom).to.be.true;
		});

		it('students do not have messenger permission to open one to one chats', async () => {
			const school = await testHelper.createTestSchool({ features: ['messengerStudentRoomCreate'] });
			const student = await testHelper.createTestUser({ roles: ['student'], schoolId: school._id });
			const result = await app.service('/messengerPermissions').get(student._id);
			expect(result.createRoom).to.be.false;
		});
	});

	describe('if Matrix messenger is disabled', () => {
		let configBefore;
		let app;
		let server;

		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', false);

			app = await appPromise;
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
