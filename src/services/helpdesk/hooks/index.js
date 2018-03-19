'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const addCurrentSchoolIdFromUser = globalHooks.ifNotLocal(globalHooks.addCurrentSchoolIdFromUser);

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'), addCurrentSchoolIdFromUser],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'), addCurrentSchoolIdFromUser],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation, addCurrentSchoolIdFromUser],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation, addCurrentSchoolIdFromUser]
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
