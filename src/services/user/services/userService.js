const { authenticate } = require('@feathersjs/authentication');
// const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
// const logger = require('../../../logger');
const { modelServices: { prepareInternalParams } } = require('../../../utils');
const { userModel } = require('../model');
const { hasEditPermissionForUser, hasReadPermissionForUser } = require('../hooks/index.hooks');

const {
	mapPaginationQuery,
	resolveToIds,
	restrictToCurrentSchool,
	permitGroupOperation,
	denyIfNotCurrentSchool,
	denyIfStudentTeamCreationNotAllowed,
	computeProperty,
	addCollation,
	blockDisposableEmail,
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
	enforceRoleHierarchyOnCreate,
	filterResult,
	generateRegistrationLink,
	sendRegistrationLink,
	includeOnlySchoolRoles,
} = require('../hooks/userService');

// const USER_RABBIT_EXCHANGE = 'user';
class UserService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return this.app.service('usersModel').find(prepareInternalParams(params));
	}

	get(id, params) {
		return this.app.service('usersModel').get(id, prepareInternalParams(params));
	}

	create(data, params) {
		return this.app.service('usersModel').create(data, prepareInternalParams(params));
	}

	update(id, data, params) {
		return this.app.service('usersModel').update(id, data, prepareInternalParams(params));
	}

	patch(id, data, params) {
		return this.app.service('usersModel').patch(id, data, prepareInternalParams(params));
	}

	remove(id, params) {
		return this.app.service('usersModel').remove(id, prepareInternalParams(params));
	}

	async setup(app) {
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
			mapPaginationQuery,
			// resolve ids for role strings (e.g. 'TEACHER')
			resolveToIds('/roles', 'params.query.roles', 'name'),
			authenticate('jwt'),
			iff(isProvider('external'), restrictToCurrentSchool),
			mapRoleFilterQuery,
			addCollation,
			iff(isProvider('external'), includeOnlySchoolRoles),
		],
		get: [
			authenticate('jwt'),
		],
		create: [
			checkJwt(),
			pinIsVerified,
			iff(isProvider('external'), restrictToCurrentSchool),
			iff(isProvider('external'), enforceRoleHierarchyOnCreate),
			sanitizeData,
			checkUnique,
			checkUniqueAccount,
			blockDisposableEmail('email'),
			generateRegistrationLink,
			sendRegistrationLink,
			resolveToIds('/roles', 'data.roles', 'name'),
		],
		update: [
			iff(isProvider('external'), disallow()),
			authenticate('jwt'),
			sanitizeData,
			resolveToIds('/roles', 'data.$set.roles', 'name'),
		],
		patch: [
			authenticate('jwt'),
			iff(isProvider('external'), securePatching),
			permitGroupOperation,
			sanitizeData,
			iff(isProvider('external'), hasEditPermissionForUser),
			iff(isProvider('external'), restrictToCurrentSchool),
			resolveToIds('/roles', 'data.roles', 'name'),
			updateAccountUsername,
		],
		remove: [
			authenticate('jwt'),
			iff(isProvider('external'), [restrictToCurrentSchool, enforceRoleHierarchyOnDelete]),
		],
	},
	after: {
		all: [],
		find: [
			decorateAvatar,
			decorateUsers,
			iff(isProvider('external'), [filterResult, denyIfStudentTeamCreationNotAllowed({
				errorMessage: 'The current user is not allowed to list other users!',
			})]),
		],
		get: [
			decorateAvatar,
			decorateUser,
			computeProperty(userModel, 'getPermissions', 'permissions'),
			iff(isProvider('external'), [hasReadPermissionForUser,
				denyIfNotCurrentSchool({
					errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!',
				})]),
			iff(isProvider('external'), filterResult),
		],
		create: [
			handleClassId,
		],
		update: [iff(isProvider('external'), filterResult)],
		patch: [iff(isProvider('external'), filterResult)],
		remove: [
			pushRemoveEvent,
			removeStudentFromClasses,
			removeStudentFromCourses,
			iff(isProvider('external'), filterResult),
		],
	},
};

module.exports = {
	userHooks,
	userService,
};
