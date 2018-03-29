'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE'),restrictToCurrentSchool],
	update: [globalHooks.hasPermission('HELPDESK_EDIT'),restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation,restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('HELPDESK_CREATE'),globalHooks.permitGroupOperation]
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
