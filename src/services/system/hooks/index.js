'use strict';

const {isAdmin, ifNotLocal, permitGroupOperation} = require('../../../hooks');
const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE')],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE'), permitGroupOperation]
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
