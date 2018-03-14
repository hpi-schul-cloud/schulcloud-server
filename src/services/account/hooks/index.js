'use strict';

const auth = require('feathers-authentication');
const hooks = require('feathers-hooks');
const local = require('feathers-authentication-local');
const errors = require('feathers-errors');
const bcrypt = require('bcryptjs');
const globalHooks = require('../../../hooks');

const MoodleLoginStrategy = require('../strategies/moodle');
const ITSLearningLoginStrategy = require('../strategies/itslearning');
const IServLoginStrategy = require('../strategies/iserv');
const LocalLoginStrategy = require('../strategies/local');

// don't initialize strategies here - otherwise massive overhead
// TODO: initialize all strategies here once
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	iserv: IServLoginStrategy,
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

const trimPassword = (hook) => {
	if (hook.data.password)
		hook.data.password = hook.data.password.trim();

	return hook;
};

const validatePassword = (hook) => {
	let password_verification = hook.data.password_verification;
	let password = hook.data.password;

	// in case sso created account skip
	if (!hook.params.account.userId)
		return hook;

	return Promise.all([globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_CREATE'), globalHooks.hasRoleNoHook(hook, hook.id, 'student', true)])
		.then(results => {
			if (results[0] && results[1]) {
				return hook;
			} else {
				if (password && !password_verification)
					throw new errors.Forbidden('Password was given, but no verification password');

				if (password_verification) {
					return new Promise((resolve, reject) => {
						bcrypt.compare(password_verification, hook.params.account.password, (err, res) => {
							if (err)
								reject(new errors.BadRequest('Ups, bcrypt ran into an error.'));
							if (!res)
								reject(new errors.BadRequest('Password does not match!'));
							resolve();
						});
					});
				}
			}
		});
};

const checkUnique = (hook) => {
	let accountService = hook.service;
	const {username, systemId} = hook.data;
	return accountService.find({ query: {username, systemId}})
		.then(result => {
			const filtered = result.filter(a => a.systemId == systemId);	// systemId might be null. In that case, accounts with any systemId will be returned
			if(filtered.length > 0) return Promise.reject(new errors.BadRequest('Der Benutzername ist bereits vergeben!'));
			return Promise.resolve(hook);
		});
};

const restrictAccess = (hook) => {
	let queries = hook.params.query;

	return new Promise ((resolve, reject) => {
		if (!queries.username && !queries.userId)
			return reject(new errors.BadRequest("Not allowed"));
		else
			return resolve();
	});
};

exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [restrictAccess],
	get: [],
	create: [
		validateCredentials,
		trimPassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
		checkUnique
	],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('ACCOUNT_EDIT')],
	patch: [auth.hooks.authenticate('jwt'),
			globalHooks.permitGroupOperation,
			trimPassword,
			validatePassword,
			local.hooks.hashPassword({ passwordField: 'password' })],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('ACCOUNT_CREATE'),globalHooks.permitGroupOperation]
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
