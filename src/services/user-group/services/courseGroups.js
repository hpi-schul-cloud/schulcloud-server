const { authenticate } = require('@feathersjs/authentication');
const {	iff, isProvider } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { modelServices: { prepareInternalParams } } = require('../../../utils');


const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const {
	restrictToUsersCourses,
	denyIfNotInCourse,
} = require('../hooks/courseGroups');

class CourseGroups {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return this.app.service('courseGroupModel').find(prepareInternalParams(params));
	}

	get(id, params) {
		return this.app.service('courseGroupModel').get(id, prepareInternalParams(params));
	}

	create(data, params) {
		return this.app.service('courseGroupModel').create(data, prepareInternalParams(params));
	}

	update(id, data, params) {
		return this.app.service('courseGroupModel').update(id, data, prepareInternalParams(params));
	}

	patch(id, data, params) {
		return this.app.service('courseGroupModel').patch(id, data, prepareInternalParams(params));
	}

	remove(id, params) {
		return this.app.service('courseGroupModel').remove(id, prepareInternalParams(params));
	}

	setup(app) {
		this.app = app;
	}
}

const courseGroupService = new CourseGroups({
	paginate: {
		default: 25,
		max: 100,
	},
});

const courseGroupHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [iff(isProvider('external'), [
			globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool, restrictToUsersCourses,
		])],
		get: [globalHooks.hasPermission('COURSE_VIEW')],
		create: [
			iff(isProvider('external'), [
				globalHooks.hasPermission('COURSEGROUP_CREATE'),
				restrictToCurrentSchool,
				restrictToUsersCourses,
			]),
		],
		update: [iff(isProvider('external'), [
			globalHooks.hasPermission('COURSEGROUP_EDIT'), restrictToCurrentSchool, restrictToUsersCourses,
		])],
		patch: [iff(isProvider('external'), [
			globalHooks.hasPermission('COURSEGROUP_EDIT'),
			restrictToCurrentSchool,
			restrictToUsersCourses,
			globalHooks.permitGroupOperation,
		])],
		remove: [iff(isProvider('external'), [
			globalHooks.hasPermission('COURSEGROUP_CREATE'),
			restrictToCurrentSchool,
			restrictToUsersCourses,
			globalHooks.permitGroupOperation,
		])],
	},
	after: {
		all: [],
		find: [],
		get: [iff(isProvider('external'), [
			globalHooks.denyIfNotCurrentSchool({
				errorMessage: 'You do not have valid permissions to access this.',
			}), denyIfNotInCourse,
		])],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};


module.exports = { courseGroupService, courseGroupHooks };
