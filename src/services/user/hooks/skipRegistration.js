const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const testHook = (hook) => {
	return Promise.resolve(hook);
}

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [testHook, globalHooks.restrictToCurrentSchool],
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
