'use strict';

const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt'), globalHooks.isSuperHero()],
	update: [],
	patch: [],
	remove: []
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
