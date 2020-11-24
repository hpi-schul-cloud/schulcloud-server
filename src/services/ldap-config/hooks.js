const { authenticate } = require('@feathersjs/authentication');

const { lookupSchool } = require('../../hooks');

module.exports = {
	before: {
		all: [authenticate('jwt')],
		get: [],
		create: [lookupSchool],
		patch: [lookupSchool],
	},
	after: {
		all: [],
	},
};
