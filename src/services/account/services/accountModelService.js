const service = require('feathers-mongoose');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const accountModel = require('../model');

const accountModelService = service({
	Model: accountModel,
	paginate: false,
	lean: true,
});

const debugPointHook = (hook) => {
	console.log('accountModel');
	return hook;
};

/**
 *  @deprecated This service is replaced by "apps\server\src\modules\account\uc\account.uc.ts" and corresponding services.
 *  This is about to be removed with completion of EW-214.
 */
const accountModelServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt'), debugPointHook],
		find: [iff(isProvider('external'), disallow())],
		get: [iff(isProvider('external'), disallow())],
		create: [iff(isProvider('external'), disallow())],
		update: [iff(isProvider('external'), disallow())],
		patch: [iff(isProvider('external'), disallow())],
		remove: [iff(isProvider('external'), disallow())],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { accountModelService, accountModelServiceHooks };
