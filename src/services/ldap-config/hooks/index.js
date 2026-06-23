const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');

const { populateCurrentSchool } = require('../../../hooks');
const fillDefaultValues = require('./fillDefaultValues');
const restrictToSchoolSystems = require('../../ldap/hooks/restrictToSchoolSystems');

const hasEditPermission = async (context) => {
	const { userId } = context.params.account;
	const { roles } = await context.app.service('users').get(userId, { query: { $populate: 'roles' } });
	const isAdministrator = roles.find((r) => r.name === 'administrator');

	if (!isAdministrator) {
		throw new Error('You do not have permission to change the LDAP configuration');
	}
};

const hasCreatePermission = async (context) => {
	hasEditPermission(context);
};

const hasPatchPermission = async (context) => {
	hasEditPermission(context);
};

/* TODO
	globalHooks.hasPermission auf ...
	SCHOOL_EDIT: 'SCHOOL_EDIT', // der wird zumindest in ldap/hooks benutzt
	SCHOOL_PERMISSION_CHANGE: 'SCHOOL_PERMISSION_CHANGE',
	SCHOOL_SYSTEM_EDIT: 'SCHOOL_SYSTEM_EDIT',
	SCHOOL_TOOL_ADMIN: 'SCHOOL_TOOL_ADMIN',
	??
	*/

module.exports = {
	before: {
		all: [authenticate('jwt')],
		get: [],
		create: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			globalHooks.hasPermission('SCHOOL_EDIT'),
			hasCreatePermission,
			populateCurrentSchool,
			fillDefaultValues,
		],
		patch: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			globalHooks.hasPermission('SCHOOL_EDIT'),
			hasPatchPermission,
			populateCurrentSchool,
			restrictToSchoolSystems,
			fillDefaultValues,
		],
		update: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
	},
};
