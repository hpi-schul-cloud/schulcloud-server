const service = require('feathers-mongoose');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { authenticateSC } = require('../../../hooks/authentication');

const accountModel = require('../model');

const accountModelService = service({
	Model: accountModel,
	paginate: false,
	lean: true,
});

const accountModelServiceHooks = {
	before: {
		all: [authenticateSC()],
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
