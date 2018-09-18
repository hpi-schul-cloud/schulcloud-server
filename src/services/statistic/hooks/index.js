'use strict';

const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.isSuperHero()],
	find: [],
	get: [],
	create: [],
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
