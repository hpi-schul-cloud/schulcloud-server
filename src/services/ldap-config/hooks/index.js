const { authenticate } = require('@feathersjs/authentication');
const { iff, keepQuery, isProvider, disallow } = require('feathers-hooks-common');

const { populateCurrentSchool } = require('../../../hooks');
const fillDefaultValues = require('./fillDefaultValues');
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
			fillDefaultValues,
		],
		patch: [
			// only allow external calls (the service needs a user)
			iff(!isProvider('external'), disallow()),
			keepQuery('activate', 'verifyOnly'),
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
