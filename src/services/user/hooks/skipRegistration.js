const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');

const { iff, isProvider } = require('feathers-hooks-common');
const { Forbidden } = require('../../../errors');

const { hasPermission } = require('../../../hooks');

/**
 * checks if the user has valid permissions to skip registration of the target user.
 * @param {context} hook hook context.
 * @throws {Forbidden} if user does not have correct permissions.
 */
const checkPermissions = async (hook) => {
	const targetUser = await hook.app.service('users').get(hook.params.route.userId, { query: { $populate: 'roles' } });
	const actingUser = await hook.app.service('users').get(hook.params.account.userId);

	const targetIsStudent = targetUser.roles[0].name === 'student';
	const targetIsTeacher = targetUser.roles[0].name === 'teacher';
	let userHasPermission = false;

	if (targetIsStudent && actingUser.permissions.includes('STUDENT_SKIP_REGISTRATION')) {
		userHasPermission = true;
	}
	if (targetIsTeacher && actingUser.permissions.includes('TEACHER_SKIP_REGISTRATION')) {
		userHasPermission = true;
	}
	if (targetUser.schoolId.toString() !== actingUser.schoolId.toString()) userHasPermission = false;
	if (!userHasPermission) return Promise.reject(new Forbidden('you do not have permission to do this!'));

	return Promise.resolve(hook);
};

const skipRegistrationSingleHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [iff(isProvider('external'), [checkPermissions])],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
};

const skipRegistrationBulkHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [iff(isProvider('external'), [hasPermission('ADMIN_VIEW')])],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
};

module.exports = { skipRegistrationSingleHooks, skipRegistrationBulkHooks };
