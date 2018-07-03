'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const _ = require('lodash');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

//TODO: throw in some security. Course belongs to Teacher (should be fine), as we only want to clone personal courses.

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
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
