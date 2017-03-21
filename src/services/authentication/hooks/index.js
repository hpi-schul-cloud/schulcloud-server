'use strict';

const auth = require('feathers-authentication');
const local = require('feathers-authentication-local');
const jwt = require('feathers-authentication-jwt');

const injectUserId = (hook) => {
	const accountId = hook.params.payload.accountId;
	return hook.app.service('/accounts').get(accountId).then((account) => {
		if(account.userId) {
			hook.params.payload.userId = account.userId;
		}
		return hook;
	});
};

const lowerCaseUsername = (hook) => {
	if (hook.data.username)
		hook.data.username = hook.data.username.toLowerCase();
	return hook;
};

exports.before = {
	create: [
		lowerCaseUsername,
		auth.hooks.authenticate(['local', 'jwt']),
		injectUserId
	],
	remove: [
		auth.hooks.authenticate('jwt')
	]
};

exports.after = {
	create: [],
	remove: []
};
