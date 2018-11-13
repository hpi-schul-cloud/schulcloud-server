'use strict';

const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt')],
	get: [auth.hooks.authenticate('jwt')],
	create: [hooks.disable()],
	update: [hooks.disable()],
	patch: [hooks.disable()],
	remove: [hooks.disable()]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
