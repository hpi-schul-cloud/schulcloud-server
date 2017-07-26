'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const search = require('feathers-mongodb-fuzzy-search');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [search({escape: false})],
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
