'use strict';

const auth = require('feathers-authentication');
const local = require('feathers-authentication-local');
const jwt = require('feathers-authentication-jwt');

const logger = require('winston');

exports.before = {
	create: [
		auth.hooks.authenticate(['local', 'jwt']),
		(hook) => {
			const accountId = hook.params.payload.accountId;
			return hook.app.service('/accounts').get(accountId).then((account) => {
				if(account.userId) {
					hook.params.payload.userId = account.userId;
				}
				return hook;
			});
		}
	],
	remove: [
		auth.hooks.authenticate('jwt')
	]
};

exports.after = {
	create: [],
	remove: []
};
