const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

const { iff, isProvider } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

const {
	restrictToCurrentSchool,
} = require('../../../hooks');

// todo check userId
exports.before = {
	all: [iff(isProvider('external'), [
		authenticate('jwt'),
		globalHooks.populateCurrentSchool,
		restrictToCurrentSchool,
	])],
	find: [],
	get: [],
	create: [iff(isProvider('external'), globalHooks.hasPermission('SCHOOL_EDIT'))],
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
