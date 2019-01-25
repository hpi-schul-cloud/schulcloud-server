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
const LdapLoginStrategy = require('../strategies/ldap');

// don't initialize strategies here - otherwise massive overhead
// TODO: initialize all strategies here once
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	iserv: IServLoginStrategy,
	local: LocalLoginStrategy,
	ldap: LdapLoginStrategy,
};

const sanitizeUsername = (hook) => {
	if (hook.data && hook.data.username) {
		hook.data.username = hook.data.username.trim().toLowerCase();
	}
	return hook;
};

// This is only for SSO
const validateCredentials = (hook) => {
	const {username, password, systemId, schoolId} = hook.data;

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
			return strategy.login({username, password}, system, schoolId);
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

	return Promise.all([
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_CREATE'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'ADMIN_VIEW'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'teacher', true),
		globalHooks.hasRole(hook, hook.params.account.userId, 'superhero')])
		.then(results => {
			// if manager has STUDENT_CREATE (=is teacher) and pw-patched user is student
					// if manager has ADMIN_VIEW (=is admin) and pw-patched user is teacher or student
							// if superhero
									// if my accountid == pw-patched accountid (edit own account in user list...)
			if ((results[0] && results[1]) || (results[2] && (results[1] || results[3])) || results[4] || hook.params.account._id.toString() === hook.id) {
				return hook;
			} else {
				if (password && !password_verification)
					throw new errors.Forbidden('Du darfst das Passwort dieses Nutzers nicht ändern oder die Passwortfelder wurden falsch ausgefüllt.');

				if (password_verification) {
					return new Promise((resolve, reject) => {
						bcrypt.compare(password_verification, hook.params.account.password, (err, res) => {
							if (err)
								reject(new errors.BadRequest('Ups, bcrypt ran into an error.'));
							if (!res)
								reject(new errors.BadRequest('Dein Passwort ist nicht korrekt!'));
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

const removePassword = (hook) => {
	const {strategy} = hook.data;
	if (strategy === 'ldap') {
		hook.data.password = '';
	}
	return Promise.resolve(hook);
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

const checkExistence = (hook) => {
	let accountService = hook.service;
	const {userId, systemId} = hook.data;

	if (!userId && systemId) // for sso accounts
		return Promise.resolve(hook);

	return accountService.find({ query: {userId}})
		.then(result => {
			const filtered = result.filter(a => a.systemId == systemId);	// systemId might be null. In that case, accounts with any systemId will be returned
			if(filtered.length > 0) return Promise.reject(new errors.BadRequest('Der Account existiert bereits!'));
			return Promise.resolve(hook);
		});
};

const securePatching = (hook) => {
	const accountService = hook.service;
	if (hook.data.userId) {
		return accountService.get(hook.id)
			.then(res => {
				if (res.systemId)
					return Promise.resolve(hook);
				else
					return Promise.reject(new errors.Forbidden('Die userId kann nicht geändert werden.'));
			});
	}
	return Promise.resolve(hook);
};

const clearPwHash = hook =>{
	if(hook.result.password){
		delete hook.result.password
	}
	return hook
}

/**
 * @method get
 * @param {Array of strings} keys
 * @afterHook
 * @notLocal
 */
const filterToRelated=(keys)=>{
	return globalHooks.ifNotLocal(hook=>{
		const newResult={};
		keys.forEach(key=>{
			if(hook.result[key]!==undefined){
				newResult[key]=hook.result[key];
			}
		})
		hook.result=newResult;
		return hook
	});
}

exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [restrictAccess],
	get: [],
	create: [
		sanitizeUsername,
		checkExistence,
		validateCredentials,
		trimPassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
		checkUnique,
		removePassword,
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('ACCOUNT_EDIT'),
		sanitizeUsername,
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		sanitizeUsername,
		securePatching,
		globalHooks.permitGroupOperation,
		trimPassword,
		validatePassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
	],
	remove: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('ACCOUNT_CREATE'),
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [clearPwHash],
	find: [],
	get: [filterToRelated(['_id','username','userId','systemId'])],
	create: [],
	update: [],
	patch: [],
	remove: []
};
