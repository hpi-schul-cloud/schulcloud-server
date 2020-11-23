const { authenticate } = require('@feathersjs/authentication');

const { lookupSchool } = require('../../hooks');

module.exports = {
	before: {
		all: [authenticate('jwt'), lookupSchool],
	},
	after: {
		all: [],
	},
};
