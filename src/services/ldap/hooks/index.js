'use strict';

const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt'), restrictToCurrentSchool, globalHooks.hasPermission('SYSTEM_EDIT')],
	get: [auth.hooks.authenticate('jwt'), restrictToCurrentSchool, globalHooks.hasPermission('SYSTEM_EDIT')],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
