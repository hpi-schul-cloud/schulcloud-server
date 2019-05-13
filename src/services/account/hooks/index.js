const local = require('@feathersjs/authentication-local');
const globalHooks = require('../../../hooks');

const {
	validateCredentials,
	trimPassword,
	validatePassword,
	checkUnique,
	removePassword,
	restrictAccess,
	checkExistence,
	protectUserId,
	securePatching,
	sanitizeUsername,
	filterToRelated,
} = require('./hooks');

exports.before = {
	// find, get and create cannot be protected by authenticateJWT
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
		globalHooks.authenticateJWT,
		globalHooks.hasPermission('ACCOUNT_EDIT'),
		sanitizeUsername,
	],
	patch: [
		globalHooks.authenticateJWT,
		sanitizeUsername,
		globalHooks.ifNotLocal(securePatching),
		protectUserId,
		globalHooks.permitGroupOperation,
		trimPassword,
		validatePassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
	],
	remove: [
		globalHooks.authenticateJWT,
		globalHooks.hasPermission('ACCOUNT_CREATE'),
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [local.hooks.protect('password')],
	find: [],
	get: [filterToRelated(['_id', 'username', 'userId', 'systemId'])],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
