'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('NEWS_VIEW')],
	get: [globalHooks.hasPermission('NEWS_VIEW')],
	create: [globalHooks.hasPermission('NEWS_CREATE')],
	update: [globalHooks.hasPermission('NEWS_EDIT')],
	patch: [globalHooks.hasPermission('NEWS_EDIT')],
	remove: [globalHooks.hasPermission('NEWS_CREATE')]
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
