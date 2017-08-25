'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('USERGROUP_VIEW'), restrictToCurrentSchool],
	get: [globalHooks.hasPermission('USERGROUP_VIEW')],
	create: [globalHooks.hasPermission('USERGROUP_CREATE')],
	update: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool]
};

exports.after = {
	all: [],
	find: [],
	get: [globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!'}))],
	create: [],
	update: [],
	patch: [],
	remove: []
};
