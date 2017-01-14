'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt')],
	update: [auth.hooks.authenticate('jwt')],
	patch: [auth.hooks.authenticate('jwt')],
	remove: [auth.hooks.authenticate('jwt')]
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
