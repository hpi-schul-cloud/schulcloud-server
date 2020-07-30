const { authenticate } = require('@feathersjs/authentication');
const {
	iff, isProvider, discard, disallow, keepInArray, keep,
} = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { modelServices: { prepareInternalParams } } = require('../../../utils');


const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);
const populateInQuery = (context) => (context.params.query || {}).$populate;

const {
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
	removeSubstitutionDuplicates,
} = require('../hooks/courses');

const { checkScopePermissions } = require('../../helpers/scopePermissions/hooks');

class Courses {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return this.app.service('courseModel').find(prepareInternalParams(params));
	}

	get(id, params) {
		return this.app.service('courseModel').get(id, prepareInternalParams(params));
	}

	create(data, params) {
		return this.app.service('courseModel').create(data, prepareInternalParams(params));
	}

	update(id, data, params) {
		return this.app.service('courseModel').update(id, data, prepareInternalParams(params));
	}

	patch(id, data, params) {
		return this.app.service('courseModel').patch(id, data, prepareInternalParams(params));
	}

	remove(id, params) {
		return this.app.service('courseModel').remove(id, prepareInternalParams(params));
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
			globalHooks.addCollation,
		],
		get: [courseInviteHook],
		create: [
			globalHooks.injectUserId,
			globalHooks.hasPermission('COURSE_CREATE'),
			removeSubstitutionDuplicates,
			restrictToCurrentSchool,
		],
		update: [
			checkScopePermissions(['COURSE_EDIT']),
			restrictToCurrentSchool,
			restrictToUsersOwnCourses,
			restrictChangesToArchivedCourse,
		],
		patch: [
			patchPermissionHook,
			restrictToCurrentSchool,
			restrictChangesToArchivedCourse,
			globalHooks.permitGroupOperation,
			removeSubstitutionDuplicates,
			deleteWholeClassFromCourse,
		],
		remove: [
			checkScopePermissions(['COURSE_DELETE']),
			restrictToCurrentSchool,
			restrictToUsersOwnCourses,
			globalHooks.permitGroupOperation,
		],
	},
	after: {
		all: [],
		find: [
			iff(populateInQuery,
				[
					keepInArray('classIds', ['_id', 'displayName']),
					keepInArray('teacherIds', ['_id', 'firstName', 'lastName']),
					keepInArray('userIds', ['_id', 'firstName', 'lastName', 'fullName', 'schoolId']),
				]),
		],
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
};

module.exports = { courseService, courseHooks };
