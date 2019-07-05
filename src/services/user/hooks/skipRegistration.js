const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');

const globalHooks = require('../../../hooks');


const checkPermissions = async (hook) => {
	const targetUser = await hook.app.service('users').get(hook.params.route.userid,
		{ query: { $populate: 'roles' } });
	const actingUser = await hook.app.service('users').get(hook.params.account.userId);

	const targetIsStudent = targetUser.roles[0].name === 'student';
	const targetIsTeacher = targetUser.roles[0].name === 'teacher';
	let hasPermission = false;

	if (targetIsStudent && actingUser.permissions.includes('STUDENT_SKIP_REGISTRATION')) {
		hasPermission = true;
	}
	if (targetIsTeacher && actingUser.permissions.includes('TEACHER_SKIP_REGISTRATION')) {
		hasPermission = true;
	}
	if (targetUser.schoolId !== actingUser.schoolId) hasPermission = false;
	if (!hasPermission) return Promise.reject(new Forbidden('you do not have permission to do this!'));

	return Promise.resolve(hook);
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [globalHooks.ifNotLocal(checkPermissions)],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
