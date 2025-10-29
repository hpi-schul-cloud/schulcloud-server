const service = require('../../../utils/feathers-mongoose');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const { courseModel } = require('../model');
const { restrictLockedCourse, filterOutLockedCourses } = require('../hooks/courses');

const courseModelService = service({
	Model: courseModel,
	paginate: {
		default: 10000,
		max: 10000,
	},
	lean: { virtuals: true },
});

const courseModelServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [filterOutLockedCourses, iff(isProvider('external'), disallow())],
		get: [restrictLockedCourse, iff(isProvider('external'), disallow())],
		create: [iff(isProvider('external'), disallow())],
		update: [restrictLockedCourse, iff(isProvider('external'), disallow())],
		patch: [restrictLockedCourse, iff(isProvider('external'), disallow())],
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

module.exports = { courseModelService, courseModelServiceHooks };
