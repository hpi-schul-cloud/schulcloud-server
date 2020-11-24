const { authenticate } = require('@feathersjs/authentication');
const { iff, keepQuery, isProvider, disallow } = require('feathers-hooks-common');

const { populateCurrentSchool } = require('../../../hooks');
const restrictToSchoolSystems = require('../../ldap/hooks/restrictToSchoolSystems');

module.exports = {
	before: {
		all: [authenticate('jwt')],
		get: [iff(isProvider('external'), keepQuery([]))],
		create: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			keepQuery('activate', 'verifyOnly'),
			populateCurrentSchool,
		],
		patch: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			keepQuery('activate', 'verifyOnly'),
			populateCurrentSchool,
			restrictToSchoolSystems,
		],
		update: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
	},
};
