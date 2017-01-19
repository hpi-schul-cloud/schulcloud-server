'use strict';

const auth = require('feathers-authentication');
const hooks = require('feathers-hooks');
const local = require('feathers-authentication-local');
const errors = require('feathers-errors');

const MoodleLoginStrategy = require('../strategies/moodle');
const ITSLearningLoginStrategy = require('../strategies/itslearning');
const LernsaxLoginStrategy = require('../strategies/lernsax');
const LocalLoginStrategy = require('../strategies/local');

// don't initialize strategies here - otherwise massive overhead
// TODO: initialize all strategies here once
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	lernsax: LernsaxLoginStrategy,
	local: LocalLoginStrategy
};


// This function decides whether this is a SSO account or not
// and adds required data to hook.data
const provideCredentials = (hook) => {
	const systemId = hook.data.systemId;
	if(systemId) {
		return validateCredentials(hook);
	} else {
		return generateLocalSignInUsername(hook);
	}
};


// This is only for SSO
const validateCredentials = (hook) => {
	const {username, password, systemId} = hook.data;

	if(!username) throw new errors.BadRequest('no username specified');
	if(!password) throw new errors.BadRequest('no password specified');

	const app = hook.app;
	const systemService = app.service('/systems');
	return systemService.get(systemId)
		.then(system => {
			const strategy = strategies[system.type];
			return {
				strategy: new strategy(app),
				system
			};
		})
		.then(({strategy, system}) => {
			return strategy.login({username, password}, system);
		})
		.then((client) => {
			if (client.token) {
				hook.data.token = client.token;
			}
		});
};

// This is for non-SSO users
const generateLocalSignInUsername = (hook) => {
	// TODO: will be refactored by @carl


	// TODO: Only generate username

	const userId = hook.data.userId;
	const userService = hook.app.service('/users');
	return userService.get(userId)
		.then(user => {

			// TODO: will be refactored by @carl
			var helper = new AccountHelper();
			return helper.create(user).then((credentials) => {
				hook.data.username = credentials.username;
				return hook;
			});

		});
};


exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [],
	get: [],
	create: [
		provideCredentials,
		local.hooks.hashPassword({ passwordField: 'password' })
	],
	update: [auth.hooks.authenticate('jwt')],
	patch: [auth.hooks.authenticate('jwt')],
	remove: [auth.hooks.authenticate('jwt')]
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
