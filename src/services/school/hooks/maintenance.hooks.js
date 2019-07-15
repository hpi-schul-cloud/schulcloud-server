const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const lookupSchool = require('./lookupSchool');

module.exports = {
	before: {
		all: [
			globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
			globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
			lookupSchool,
		],
		find: [],
		create: [
			globalHooks.ifNotLocal(globalHooks.hasPermission('SCHOOL_EDIT')),
		],
		update: [hooks.disallow()],
		get: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
};
