const assert = require('assert');
const mockery = require('mockery');

const app = require('../../../../src/app');
const testObjects = require('../../../../test/services/helpers/testObjects')(app);

const userService = app.service('users');

/**
 * Warning: Role Changes are not handled yet.
 * @param loggedinUserPermissions {array} - an array of permissions that the requesting user has
 * @returns the hasEditPermissionForUser hook with mocked dependencies
 */
const hasPermissionHookMockGenerator = (loggedinUserPermissions = []) => {
	const globalHookMock = ({
		hasPermission: (permissions) => () => permissions.some(
			(permission) => loggedinUserPermissions.includes(permission),
		),
	});
	mockery.enable({
		warnOnReplace: false,
		warnOnUnregistered: false,
		useCleanCache: true,
	});
	mockery.registerMock('../../../hooks', globalHookMock);
	// need to require it after the mocks got defined
	// eslint-disable-next-line global-require
	const { hasEditPermissionForUser: testHook } = require('./index.hooks');
	return testHook;
};

/**
 * Warning: Role Changes are not handled yet.
 * @param promise {Promise} - an array of permissions that the requesting user has
 * @param sucess {Promise} - should the promise succeed?
 * @returns the promise
 */
const assertPromiseStatus = (promise, success) => promise.then((result) => {
	assert.ok(success);
	return result;
}).catch((error) => {
	assert.ok(!success);
	return error;
});

describe('user index hooks', () => {
	it('can edit a student when current user has the STUDENT_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator(['STUDENT_EDIT']);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['student'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), true);
		mockery.disable();
	});

	it('can not edit a student when current user has not the STUDENT_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator([]);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['student'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), false);
		mockery.disable();
	});

	it('can edit a teachers when current user has the TEACHER_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator(['TEACHER_EDIT']);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['teacher'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), true);
		mockery.disable();
	});

	it('can not edit a teacher when current user has not the TEACHER_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator([]);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['teacher'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), false);
		mockery.disable();
	});

	it('can edit an admin when current user has ADMIN_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator(['ADMIN_EDIT']);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['administrator'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), true);
		mockery.disable();
	});

	it('can not edit an admin when current user has not the ADMIN_EDIT permission', async () => {
		const testHook = hasPermissionHookMockGenerator([]);
		const { _id: targetId } = await testObjects.createTestUser({ roles: ['administrator'] });
		const context = {
			id: targetId,
			service: userService,
		};
		assertPromiseStatus(testHook(context), false);
		mockery.disable();
	});

	afterEach(async () => {
		mockery.disable();
	});

	after(testObjects.cleanup);
});
