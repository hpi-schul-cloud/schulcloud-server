'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.restrictToCurrentSchool],
	get: [],
	create: [],
	update: [globalHooks.restrictToCurrentSchool],
	patch: [globalHooks.restrictToCurrentSchool],
	remove: [globalHooks.restrictToCurrentSchool]
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
