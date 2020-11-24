const { authenticate } = require('@feathersjs/authentication');
const { iff, keepQuery, isProvider, disallow } = require('feathers-hooks-common');

const { lookupSchool } = require('../../../hooks');

module.exports = {
	before: {
		all: [authenticate('jwt')],
		get: [iff(isProvider('external'), keepQuery([]))],
		create: [iff(isProvider('external'), keepQuery('activate', 'verifyOnly')), lookupSchool],
		patch: [iff(isProvider('external'), keepQuery('activate', 'verifyOnly')), lookupSchool],
		update: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
	},
};
