const { authenticate } = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const { lookupSchool } = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

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

	const TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION = hook.app.Config
		.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION');
	switch (TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION) {
		case 'opt-in':
			// own school and other schools if opted-in
			hook.params.query.$or = [
				{ schoolId: hook.params.account.schoolId },
				{ discoverable: true },
			];
			break;
		case 'opt-out':
			// everybody who did not opt-out or from same school
			hook.params.query.discoverable = { $ne: false }; // must not be false (but true or undefined/null)
			break;
		case 'disabled':
			// force foreign school id to be set
			if (equalIds(hook.params.account.schoolId, hook.params.query.schoolId) !== true) {
				throw new Forbidden('access to foreign school teachers prohibited');
			}
			break;
		default:
			// 'enabled'
			break;
	}

	return Promise.resolve(hook);
};

exports.before = {
	all: [],
	find: [
		authenticate('jwt'),
		lookupSchool,
		globalHooks.mapPaginationQuery.bind(this),
		filterForPublicTeacher,
		// resolve ids for role strings (e.g. 'TEACHER')
		globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),
		mapRoleFilterQuery,
	],
	get: [authenticate('jwt')],
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
