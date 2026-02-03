const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const testHelper = require('../../helpers/testObjects');
const {
	hasEditPermissionForUser,
	hasReadPermissionForUser,
} = require('../../../../src/services/user/hooks/index.hooks');

describe('user hooks', () => {
	let app;
	let userService;
	let server;
	let nestServices;
	let configBefore;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_NEXBOARD_COPY_ENABLED', false);
		app = await appPromise();
		testObjects = testHelper(app);
		userService = app.service('users');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		Configuration.reset(configBefore);
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('hasEditPermissionForUser', () => {
		it('can edit your own user', async () => {
			const teacherUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(teacherUser);
			const context = {
				id: teacherUser._id.toString(),
				params,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can edit a student when current user has the STUDENT_EDIT permission', async () => {
			const key = 'STUDENT_EDIT';
			await testObjects.createTestRole({
				name: key,
				permissions: [key],
			});
			const user = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: user._id.toString(),
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can not edit a student when current user has not the STUDENT_EDIT permission', async () => {
			const key = 'NO_STUDENT_EDIT';
			await testObjects.createTestRole({
				name: key,
				permissions: [],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can edit a teachers when current user has the TEACHER_EDIT permission', async () => {
			const key = 'TEACHER_EDIT';
			await testObjects.createTestRole({
				name: key,
				permissions: [key],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can not edit a teacher when current user has not the TEACHER_EDIT permission', async () => {
			const key = 'NO_TEACHER_EDIT';
			await testObjects.createTestRole({
				name: key,
				permissions: [],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can edit an admin when current user has ADMIN_EDIT permission', async () => {
			const key = 'ADMIN_EDIT';
			await testObjects.createTestRole({
				name: key,
				permissions: [key],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can not edit an admin when current user has not the ADMIN_EDIT permission', async () => {
			const key = 'ADMIN_EDIT_OTHER';
			await testObjects.createTestRole({
				name: key,
				permissions: [],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasEditPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});
	});

	describe('hasReadPermissionForUser', () => {
		it('can read own user', async () => {
			const teacherUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(teacherUser);
			const context = {
				id: teacherUser._id,
				params,
			};

			const result = await hasReadPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can read a student when current user has the STUDENT_LIST permission', async () => {
			const key = 'STUDENT_LIST';
			await testObjects.createTestRole({
				name: key,
				permissions: [key],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasReadPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can not read a student when current user has not the STUDENT_LIST permission', async () => {
			const key = 'STUDENT_LIST_OTHER';
			await testObjects.createTestRole({
				name: key,
				permissions: [],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasReadPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can read a teachers when current user has the TEACHER_LIST permission', async () => {
			const key = 'TEACHER_LIST_OTHER';
			await testObjects.createTestRole({
				name: key,
				permissions: [key],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasReadPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});

		it('can not read a teacher when current user has not the TEACHER_LIST permission', async () => {
			const key = 'TEACHER_LIST';
			await testObjects.createTestRole({
				name: key,
				permissions: [],
			});
			const { _id: targetId } = await testObjects.createTestUser({ roles: [key] });
			const context = {
				id: targetId,
				service: userService,
			};

			const result = await hasReadPermissionForUser(context);

			expect(result).to.deep.equal(context);
		});
	});
});
