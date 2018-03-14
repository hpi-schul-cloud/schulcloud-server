'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

exports.before = {
	all: [
		auth.hooks.authenticate('jwt')
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [globalHooks.permitGroupOperation],
	remove: [globalHooks.permitGroupOperation]
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
