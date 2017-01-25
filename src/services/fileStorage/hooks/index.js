'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const resolveUserId = (hook) => {
	hook.params.payload.userId = hook.params.account.userId ? hook.params.account.userId : '';
	return hook;
};

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		resolveUserId
	],
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
