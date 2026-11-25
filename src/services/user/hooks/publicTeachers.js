const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');

const { Forbidden } = require('../../../errors');
const globalHooks = require('../../../hooks');

const restrictToTeachersWithTeams = async (hook) => {
	const permited = await globalHooks.hasRole(hook, hook.params.account.userId, 'teacher');
	if (permited) {
		return Promise.resolve(hook);
	}
	throw new Forbidden("You don't have the necessary permissions to see teachers of other schools");
};

const mapRoleFilterQuery = (hook) => {
	if (hook.params.query.roles) {
		const rolesFilter = hook.params.query.roles;
		hook.params.query.roles = {};
		hook.params.query.roles.$in = rolesFilter;
	}

	return Promise.resolve(hook);
};

const filterForPublicTeacher = (hook) => {
	// Limit accessible fields
	hook.params.query.$select = ['_id', 'firstName', 'lastName', 'schoolId', 'outdatedSince'];

	// Limit accessible user (only teacher which are discoverable)
	hook.params.query.roles = ['teacher'];

	// own school and other schools if opted-in
	hook.params.query.$or = [{ schoolId: hook.params.account.schoolId }, { discoverable: true }];

	return Promise.resolve(hook);
};

exports.before = {
	all: [authenticate('jwt')],
	find: [
		globalHooks.lookupSchool,
		globalHooks.mapPaginationQuery,
		restrictToTeachersWithTeams,
		filterForPublicTeacher,
		// resolve ids for role strings (e.g. 'TEACHER')
		globalHooks.resolveToIds('/roles', 'params.query.roles', 'name'),
		mapRoleFilterQuery,
		globalHooks.addCollation,
	],
	get: [disallow()],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
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
