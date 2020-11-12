const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const UserUc = require('../uc/users.uc');

class UserServiceV2 {
	async remove(id, params) {
		const { query } = params;
		return this.userUC.deleteUser(id || query.userId);
	}

	async setup(app) {
		this.app = app;
		this.userUC = new UserUc(app);
	}
}

const userServiceV2 = new UserServiceV2({
	// default pagination and other options
});

const hasPermission = async (context) => {
	const [
		isSuperHero,
		// isAdmin
	] = await Promise.all([
		globalHooks.hasRoleNoHook(context, context.params.account.userId, 'superhero'),
		globalHooks.hasRoleNoHook(context, context.params.account.userId, 'administrator'),
	]);

	if (isSuperHero) {
		return context;
	}

	const [targetIsStudent, targetIsTeacher, targetIsAdmin] = await Promise.all([
		globalHooks.hasRoleNoHook(context, context.id, 'student'),
		globalHooks.hasRoleNoHook(context, context.id, 'teacher'),
		globalHooks.hasRoleNoHook(context, context.id, 'administrator'),
	]);
	let permissionChecks = [true];
	if (targetIsStudent) {
		permissionChecks.push(globalHooks.hasPermissionNoHook(context, context.params.account.userId, 'STUDENT_DELETE'));
	}
	if (targetIsTeacher) {
		permissionChecks.push(globalHooks.hasPermissionNoHook(context, context.params.account.userId, 'TEACHER_DELETE'));
	}
	if (targetIsAdmin) {
		permissionChecks.push(isSuperHero);
	}

	permissionChecks = await Promise.all(permissionChecks);

	if (!permissionChecks.reduce((accumulator, val) => accumulator && val)) {
		throw new Forbidden('you dont have permission to delete this user!');
	}

	return context;
};

const restrictToSameSchool = async (context) => {
	const isSuperHero = await globalHooks.hasRole(context, context.params.account.userId, 'superhero');
	if (isSuperHero) {
		return context;
	}

	let targetId;
	if (context.id) {
		targetId = context.id;
	} else {
		targetId = (((context || {}).params || {}).query || {}).userId;
	}

	if (targetId) {
		const { schoolId: currentUserSchoolId } = await globalHooks.getUser(context);
		const { schoolId: requestedUserSchoolId } = await context.app.service('users').get(targetId);

		if (!equalIds(currentUserSchoolId, requestedUserSchoolId)) {
			throw new Forbidden('You have no access.');
		}

		return context;
	}

	throw new BadRequest('The request query should include a valid userId');
};

const userServiceV2Hooks = {
	before: {
		all: [
			authenticate('jwt'),
			hasPermission,
			// TODO: Seperate routes and checks for student, and teacher, and admin deletion
			// globalHooks.hasPermission(['STUDENT_DELETE', 'TEACHER_DELETE']),
			restrictToSameSchool,
		],
	},
	after: {},
};

module.exports = { userServiceV2, userServiceV2Hooks };
