'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')]
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
