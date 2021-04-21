const { authenticate } = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { iff, isProvider, disallow, keep } = require('feathers-hooks-common');
const {
	hasPermission,
	permitGroupOperation,
	restrictToCurrentSchool,
	preventPopulate,
	getRestrictPopulatesHook,
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
	// filterToRelated,
	restrictToUsersSchool,
	validateUserName,
	restrictToSameSchool,
} = require('../hooks');
const {
	modelServices: { prepareInternalParams },
} = require('../../../utils');

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

const populateWhitelist = {
	userId: ['_id', 'firstName', 'lastName', 'email'],
};

const accountServiceHooks = {
	before: {
		// find, get and create cannot be protected by authenticate('jwt')
		// the route is used internally by login and admin services
		find: [
			authenticate('jwt'),
			iff(isProvider('external'), restrictAccess),
			iff(isProvider('external'), restrictToSameSchool),
			iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		],
		get: [disallow('external')],
		create: [
			sanitizeUsername,
			validateUserName,
			checkExistence,
			validateCredentials,
			trimPassword,
			local.hooks.hashPassword('password'),
			checkUnique,
			removePassword,
		],
		update: [disallow('external')],
		patch: [
			authenticate('jwt'),
			iff(isProvider('external'), preventPopulate),
			sanitizeUsername,
			validateUserName,
			checkUnique,
			iff(isProvider('external'), restrictToUsersSchool),
			iff(isProvider('external'), securePatching),
			protectUserId,
			permitGroupOperation,
			trimPassword,
			iff(isProvider('external'), validatePassword),
			local.hooks.hashPassword('password'),
		],
		remove: [
			authenticate('jwt'),
			hasPermission('ACCOUNT_CREATE'),
			iff(isProvider('external'), restrictToUsersSchool),
			iff(isProvider('external'), preventPopulate),
			permitGroupOperation,
		],
	},
	after: {
		all: [local.hooks.protect('password')],
		find: [],
		get: [iff(isProvider('external'), keep(['_id', 'username', 'userId', 'systemId']))],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { accountService, accountServiceHooks };
