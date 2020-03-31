const { authenticate } = require('@feathersjs/authentication');
// const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
// const logger = require('../../../logger');
const { modelServices: { prepareInternalParams } } = require('../../../utils');

const { userModel } = require('../model');
const { hasEditPermissionForUser } = require('../hooks/index.hooks');
const {
	mapPaginationQuery,
	resolveToIds,
	restrictToCurrentSchool,
	permitGroupOperation,
	denyIfNotCurrentSchool,
	computeProperty,
} = require('../../../hooks');
const {
	mapRoleFilterQuery,
	checkUnique,
	checkJwt,
	checkUniqueAccount,
	updateAccountUsername,
	removeStudentFromClasses,
	removeStudentFromCourses,
	sanitizeData,
	pinIsVerified,
	securePatching,
	decorateUser,
	decorateAvatar,
	decorateUsers,
	handleClassId,
	pushRemoveEvent,
	enforceRoleHierarchyOnDelete,
} = require('../hooks/userService');

class UserService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		console.log(!!this.app)
		return this.app.service('usersModel').find(prepareInternalParams(params));
	}

	get(id, params) {
		console.log(!!this.app)
		return this.app.service('usersModel').get(id, prepareInternalParams(params));
	}

	create(data, params) {
		console.log(!!this.app)
		return this.app.service('usersModel').create(data, prepareInternalParams(params));
	}

	update(id, data, params) {
		console.log(!!this.app)
		return this.app.service('usersModel').update(id, data, prepareInternalParams(params));
	}

	patch(id, data, params) {
		console.log(!!this.app)
		return this.app.service('usersModel').patch(id, data, prepareInternalParams(params));
	}

	remove(id, params) {
		console.log(!!this.app)
		return this.app.service('usersModel').remove(id, prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
	}
}

const userService = new UserService({
	paginate: {
		default: 1000,
		max: 5000,
	},
});

const userHooks = {
	before: {
		all: [],
		find: [
			mapPaginationQuery.bind(this),
			// resolve ids for role strings (e.g. 'TEACHER')
			resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),
			authenticate('jwt'),
			iff(isProvider('external'), restrictToCurrentSchool),
			mapRoleFilterQuery,
		],
		get: [authenticate('jwt')],
		create: [
			checkJwt(),
			pinIsVerified,
			sanitizeData,
			checkUnique,
			checkUniqueAccount,
			resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
		],
		update: [
			authenticate('jwt'),
			// TODO only local for LDAP
			sanitizeData,
			hasEditPermissionForUser,
			resolveToIds.bind(this, '/roles', 'data.$set.roles', 'name'),
		],
		patch: [
			authenticate('jwt'),
			iff(isProvider('external'), securePatching),
			permitGroupOperation,
			sanitizeData,
			hasEditPermissionForUser,
			resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
			updateAccountUsername,
		],
		remove: [
			authenticate('jwt'),
			iff(isProvider('external'), [restrictToCurrentSchool, enforceRoleHierarchyOnDelete]),
			permitGroupOperation,
		],
	},
	after: {
		all: [],
		find: [
			decorateAvatar,
			decorateUsers,
		],
		get: [
			decorateAvatar,
			decorateUser,
			computeProperty(userModel, 'getPermissions', 'permissions'),
			iff(isProvider('external'),
				denyIfNotCurrentSchool({
					errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!',
				})),
		],
		create: [
			handleClassId,
		],
		update: [],
		patch: [],
		remove: [
			pushRemoveEvent,
			removeStudentFromClasses,
			removeStudentFromCourses,
		],
	},
};

module.exports = {
	userHooks,
	userService,
};
