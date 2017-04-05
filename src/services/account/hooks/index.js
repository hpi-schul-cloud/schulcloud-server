'use strict';

const auth = require('feathers-authentication');
const hooks = require('feathers-hooks');
const local = require('feathers-authentication-local');
const errors = require('feathers-errors');
const bcrypt = require('bcryptjs');

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

// This is only for SSO
const validateCredentials = (hook) => {
	const {username, password, systemId} = hook.data;

	if(!username) throw new errors.BadRequest('no username specified');
	if(!password) throw new errors.BadRequest('no password specified');

	if(!systemId) return;

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

const validatePassword = (hook) => {
	let password_verification = hook.data.password_verification;

	return new Promise((resolve, reject) => {
		bcrypt.compare(password_verification, hook.params.account.password, (err, res) => {
			if (err)
				reject(new errors.BadRequest('Ups, bcrypt ran into an error.'));
			if (!res)
				reject(new errors.BadRequest('Password does not match!'));
			resolve();
		});
	});
};

exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [],
	get: [],
	create: [
		validateCredentials,
		local.hooks.hashPassword({ passwordField: 'password' })
	],
	update: [auth.hooks.authenticate('jwt')],
	patch: [auth.hooks.authenticate('jwt'),
			validatePassword,
			local.hooks.hashPassword({ passwordField: 'password' })],
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
