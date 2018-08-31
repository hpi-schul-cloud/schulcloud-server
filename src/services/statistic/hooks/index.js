'use strict';

const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.isAdminOrSuperHero()],
	find: [],
	get: [],
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
