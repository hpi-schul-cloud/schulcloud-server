const { authenticate } = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const {
	restrictToCurrentSchool, hasPermission, permitGroupOperation,
} = require('../../../hooks');
const {
	sanitizeUsername,
	validateCredentials,
	trimPassword,
	validatePassword,
	checkUnique,
	removePassword,
	restrictAccess,
	checkExistence,
	protectUserId,
	securePatching,
	filterToRelated,
	testIfJWTExist,
} = require('../hooks');
const { modelServices: { prepareInternalParams } } = require('../../../utils');

class Accounts {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return this.app.service('accountModel').find(prepareInternalParams(params));
	}

	get(id, params) {
		return this.app.service('accountModel').get(id, prepareInternalParams(params));
	}

	create(data, params) {
		return this.app.service('accountModel').create(data, prepareInternalParams(params));
	}

	update(id, data, params) {
		return this.app.service('accountModel').update(id, data, prepareInternalParams(params));
	}

	patch(id, data, params) {
		return this.app.service('accountModel').patch(id, data, prepareInternalParams(params));
	}

	remove(id, params) {
		return this.app.service('accountModel').remove(id, prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
	}
}

const accountService = new Accounts({
	paginate: false,
});

const accountServiceHooks = {
	before: {
		// find, get and create cannot be protected by authenticate('jwt')
		// otherwise we cannot get the accounts required for login
		find: [
			testIfJWTExist,
			iff(isProvider('external'), restrictAccess),
		],
		get: [disallow('external')],
		create: [
			sanitizeUsername,
			checkExistence,
			validateCredentials,
			trimPassword,
			local.hooks.hashPassword('password'),
			checkUnique,
			removePassword,
		],
		update: [
			authenticate('jwt'),
			hasPermission('ACCOUNT_EDIT'),
			restrictToCurrentSchool,
			sanitizeUsername,
		],
		patch: [
			authenticate('jwt'),
			sanitizeUsername,
			iff(isProvider('external'), securePatching),
			iff(isProvider('external'), restrictToCurrentSchool),
			protectUserId,
			permitGroupOperation,
			trimPassword,
			iff(isProvider('external'), validatePassword),
			local.hooks.hashPassword('password'),
		],
		remove: [
			authenticate('jwt'),
			hasPermission('ACCOUNT_CREATE'),
			permitGroupOperation,
		],
	},
	after: {
		all: [local.hooks.protect('password')],
		find: [],
		get: [filterToRelated(['_id', 'username', 'userId', 'systemId'])],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { accountService, accountServiceHooks };
