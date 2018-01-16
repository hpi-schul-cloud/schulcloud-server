'use strict';

const {isAdmin, ifNotLocal, permitGroupOperation} = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt')],
	update: [auth.hooks.authenticate('jwt')],
	patch: [auth.hooks.authenticate('jwt'), permitGroupOperation],
	remove: [auth.hooks.authenticate('jwt'), permitGroupOperation]
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
