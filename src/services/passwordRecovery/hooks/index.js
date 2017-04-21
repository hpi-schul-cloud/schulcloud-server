'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const bcrypt = require('bcryptjs');
const local = require('feathers-authentication-local');

const hashId = (hook) => {
	if (!hook.data.password) {
		const accountService = hook.app.service('/accounts');

		const username = hook.data.username;
		return accountService.find({
			query: {
				username: username
			}
		}).then((account) => {
			account = account[0];
			hook.data.account = account._id;
		});
	}
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [hashId,
		local.hooks.hashPassword({passwordField: 'password'})],
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
