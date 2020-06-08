const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

const { iff, isProvider } = require('feathers-hooks-common');

const {
	populateCurrentSchool,
	restrictToCurrentSchool,
	hasPermission,
} = require('../../../hooks');

// todo check userId
exports.before = {
	all: [iff(isProvider('external'), [
		authenticate('jwt'),
		populateCurrentSchool, // TODO: test if it is needed
		restrictToCurrentSchool,
	])],
	find: [],
	get: [],
	create: [iff(isProvider('external'), hasPermission('SCHOOL_EDIT'))],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
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
