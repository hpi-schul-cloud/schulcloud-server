'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HELPDESK_VIEW')],
	get: [globalHooks.hasPermission('HELPDESK_VIEW')],
	create: [globalHooks.hasPermission('HELPDESK_CREATE')],
	update: [globalHooks.hasPermission('HELPDESK_EDIT')],
	patch: [globalHooks.hasPermission('HELPDESK_EDIT'),globalHooks.permitGroupOperation],
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
