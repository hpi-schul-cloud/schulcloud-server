'use strict';

const commonHooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: commonHooks.disable('external'),
	get: commonHooks.disable('external'),
	create: [auth.hooks.authenticate('jwt')],
	update: commonHooks.disable('external'),
	patch: commonHooks.disable('external'),
	remove: commonHooks.disable('external'),
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