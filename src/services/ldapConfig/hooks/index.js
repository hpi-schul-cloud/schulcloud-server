'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')]
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
