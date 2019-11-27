const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);

const {
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
} = require('../hooks/courses');

class Courses {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return this.app.service('courseModel').find(params);
	}

	get(id, params) {
		return this.app.service('courseModel').get(id, params);
	}

	create(data, params) {
		return this.app.service('courseModel').create(data, params);
	}

	update(id, data, params) {
		return this.app.service('courseModel').update(id, data, params);
	}

	patch(id, data, params) {
		return this.app.service('courseModel').patch(id, data, params);
	}

	remove(id, params) {
		return this.app.service('courseModel').remove(id, params);
	}

	setup(app) {
		this.app = app;
	}
}

const courseService = new Courses({
	paginate: {
		default: 25,
		max: 100,
	},
});

const courseHooks = {
	before: {
		all: [
			authenticate('jwt'),
		],
		find: [
			globalHooks.hasPermission('COURSE_VIEW'),
			restrictToCurrentSchool,
			restrictToUsersOwnCourses,
			globalHooks.mapPaginationQuery,
		],
		get: [courseInviteHook],
		create: [
			globalHooks.injectUserId,
			globalHooks.hasPermission('COURSE_CREATE'),
			restrictToCurrentSchool,
		],
		update: [
			globalHooks.hasPermission('COURSE_EDIT'),
			restrictToCurrentSchool,
			restrictToUsersOwnCourses,
			restrictChangesToArchivedCourse,
		],
		patch: [
			patchPermissionHook,
			restrictToCurrentSchool,
			restrictChangesToArchivedCourse,
			globalHooks.permitGroupOperation,
			deleteWholeClassFromCourse,
		],
		remove: [
			globalHooks.hasPermission('COURSE_REMOVE'),
			restrictToCurrentSchool,
			restrictToUsersOwnCourses,
			globalHooks.permitGroupOperation,
		],
	},
	after: {
		all: [],
		find: [],
		get: [
			globalHooks.ifNotLocal(
				globalHooks.denyIfNotCurrentSchool({
					errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
				}),
			)],
		create: [addWholeClassToCourse],
		update: [],
		patch: [addWholeClassToCourse],
		remove: [],
	},
}

module.exports = { courseService, courseHooks };
