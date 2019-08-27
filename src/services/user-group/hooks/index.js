const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);

const {
	populateIds,
	resolveMembers,
	resolveMembersOnce,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
} = require('./courses');

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
	],
	find: [
		globalHooks.hasPermission('USERGROUP_VIEW'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
	],
	get: [
		courseInviteHook,
		populateIds,
	],
	create: [
		globalHooks.injectUserId,
		globalHooks.hasPermission('USERGROUP_CREATE'),
		restrictToCurrentSchool,
	],
	update: [
		globalHooks.hasPermission('USERGROUP_EDIT'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
		restrictChangesToArchivedCourse,
	],
	patch: [
		patchPermissionHook,
		restrictToCurrentSchool,
		restrictChangesToArchivedCourse,
		globalHooks.permitGroupOperation,
	],
	remove: [
		globalHooks.hasPermission('USERGROUP_CREATE'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [],
	find: [resolveMembers],
	get: [
		globalHooks.ifNotLocal(
			globalHooks.denyIfNotCurrentSchool({
				errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
			}),
		),
		resolveMembersOnce,
	],
	create: [resolveMembers],
	update: [resolveMembers],
	patch: [resolveMembers],
	remove: [],
};
