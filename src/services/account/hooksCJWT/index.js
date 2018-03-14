'use strict';

const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [hooks.disable()],
	get: [hooks.disable()],
	create: [auth.hooks.authenticate('jwt'), globalHooks.isSuperHero()],
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
