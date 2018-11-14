'use strict';
const globalHooks = require('../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('TOPIC_TEMPLATE_VIEW')],
	get: [globalHooks.hasPermission('TOPIC_TEMPLATE_VIEW')],
	create: [
		globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT'),
		globalHooks.injectUserId
	],
	update: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')],
	patch: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')],
	remove: [globalHooks.hasPermission('TOPIC_TEMPLATE_EDIT')]
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
