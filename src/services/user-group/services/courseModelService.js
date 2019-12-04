const service = require('feathers-mongoose');
const {
	iff, isProvider, disallow,
} = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const {	courseModel } = require('../model');

const courseModelService = service({
	Model: courseModel,
	paginate: {
		default: 25,
		max: 100,
	},
	lean: { virtuals: true },
});

const courseModelServiceHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [
			iff(isProvider('external'), disallow()),
		],
		get: [
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

module.exports = { courseModelService, courseModelServiceHooks };
