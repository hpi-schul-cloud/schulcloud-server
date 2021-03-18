const service = require('feathers-mongoose');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const { enableQuery, enableQueryAfter } = require('../../../hooks');
const { courseGroupModel } = require('../model');

const courseGroupModelService = service({
	Model: courseGroupModel,
	paginate: {
		default: 25,
		max: 100,
	},
	lean: { virtuals: true },
	multi: true,
});

const courseGroupModelServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [iff(isProvider('external'), disallow())],
		get: [iff(isProvider('external'), disallow())],
		create: [iff(isProvider('external'), disallow())],
		update: [iff(isProvider('external'), disallow())],
		patch: [iff(isProvider('external'), disallow()), enableQuery],
		remove: [iff(isProvider('external'), disallow()), enableQuery],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [enableQueryAfter],
		remove: [enableQueryAfter],
	},
};

module.exports = { courseGroupModelService, courseGroupModelServiceHooks };
