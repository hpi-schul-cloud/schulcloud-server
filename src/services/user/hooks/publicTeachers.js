const globalHooks = require('../../../hooks');

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
	hook.params.query.$select = ['_id', 'firstName', 'lastName'];

	// Limit accessible user (only teacher which are discoverable)
	hook.params.query.roles = ['teacher'];
	// hook.params.query.discoverable = true;

	return Promise.resolve(hook);
};

exports.before = {
	all: [],
	find: [
		globalHooks.mapPaginationQuery.bind(this),
		filterForPublicTeacher,
		// resolve ids for role strings (e.g. 'TEACHER')
		globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),
		globalHooks.authenticateJWT,
		mapRoleFilterQuery,
	],
	get: [globalHooks.authenticateJWT],
	create: [],
	update: [],
	patch: [],
	remove: [],
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
