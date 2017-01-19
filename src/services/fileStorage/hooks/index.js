'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const resolveUserId = (hook) => {
	return hook.app.passport.verifyJWT(hook.params.headers.authorization, hook.app.get("auth")).then(res => {
		if (res.userId) {
			hook.params.payload.userId = res.userId;
		}
		return hook;
	});
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
