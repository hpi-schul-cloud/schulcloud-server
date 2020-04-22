const service = require('feathers-mongoose');
const {
	iff, isProvider, disallow,
} = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const { enableQuery, enableQueryAfter } = require('../../../hooks');
const {	courseGroupModel } = require('../model');

const courseGroupModelService = service({
	Model: courseGroupModel,
	paginate: {
		default: 25,
		max: 100,
	},
	lean: { virtuals: true },
});

const print = (context) => {
	return context;
}

const courseGroupModelServiceHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [
			iff(isProvider('external'), disallow()),
		],
		get: [
			print,
			iff(isProvider('external'), disallow()),
		],
		create: [
			iff(isProvider('external'), disallow()),
		],
		update: [
			iff(isProvider('external'), disallow()),
		],
		patch: [
			iff(isProvider('external'), disallow()),
		],
		remove: [
			iff(isProvider('external'), disallow()),
		],
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

module.exports = { courseGroupModelService, courseGroupModelServiceHooks };
