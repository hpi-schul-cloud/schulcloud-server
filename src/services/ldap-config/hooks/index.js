const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');

const { populateCurrentSchool } = require('../../../hooks');
const fillDefaultValues = require('./fillDefaultValues');
const restrictToSchoolSystems = require('../../ldap/hooks/restrictToSchoolSystems');

module.exports = {
	before: {
		all: [authenticate('jwt')],
		get: [],
		create: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			globalHooks.hasPermission('SYSTEM_EDIT'),
			populateCurrentSchool,
			fillDefaultValues,
		],
		patch: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			globalHooks.hasPermission('SYSTEM_EDIT'),
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
