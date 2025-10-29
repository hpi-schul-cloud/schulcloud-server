const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const {
	ifNotLocal,
	restrictToCurrentSchool,
	restrictToUsersOwnCourses,
	hasPermission,
	getRestrictPopulatesHook,
	mapPaginationQuery,
	permitGroupOperation,
	addCollation,
	preventPopulate,
	injectUserId,
	denyIfNotCurrentSchool,
} = require('../../../hooks');
const {
	modelServices: { prepareInternalParams },
} = require('../../../utils');

const restrictToCurrentSchoolIfNotLocal = ifNotLocal(restrictToCurrentSchool);
const restrictToUsersOwnCoursesIfNotLocal = ifNotLocal(restrictToUsersOwnCourses);

const {
	splitClassIdsInGroupsAndClasses,
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	removeColumnBoard,
	removeContextExternalTools,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
	removeSubstitutionDuplicates,
	restrictChangesToSyncedCourse,
	restrictLockedCourse,
	filterOutLockedCourses,
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
		this.app.service('/calendar/courses').remove(id, prepareInternalParams(params));
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

const populateWhitelist = {
	classIds: ['_id', 'displayName'],
	userIds: ['_id', 'firstName', 'lastName', 'fullName', 'outdatedSince'],
	teacherIds: ['_id', 'firstName', 'lastName', 'outdatedSince'],
};

const courseHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [
			hasPermission('COURSE_VIEW'),
			filterOutLockedCourses,
			restrictToCurrentSchoolIfNotLocal,
			restrictToUsersOwnCoursesIfNotLocal,
			iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
			mapPaginationQuery,
			addCollation,
		],
		get: [
			restrictLockedCourse,
			courseInviteHook,
			iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		],
		create: [
			injectUserId,
			hasPermission('COURSE_CREATE'),
			splitClassIdsInGroupsAndClasses,
			removeSubstitutionDuplicates,
			restrictToCurrentSchoolIfNotLocal,
			iff(isProvider('external'), preventPopulate),
		],
		update: [
			restrictLockedCourse,
			checkScopePermissions(['COURSE_EDIT']),
			restrictToCurrentSchoolIfNotLocal,
			restrictToUsersOwnCoursesIfNotLocal,
			restrictChangesToArchivedCourse,
			iff(isProvider('external'), preventPopulate),
		],
		patch: [
			restrictLockedCourse,
			patchPermissionHook,
			restrictToCurrentSchoolIfNotLocal,
			restrictChangesToArchivedCourse,
			permitGroupOperation,
			restrictChangesToSyncedCourse,
			splitClassIdsInGroupsAndClasses,
			removeSubstitutionDuplicates,
			deleteWholeClassFromCourse,
			iff(isProvider('external'), preventPopulate),
		],
		remove: [
			checkScopePermissions(['COURSE_DELETE']),
			restrictToCurrentSchoolIfNotLocal,
			restrictToUsersOwnCoursesIfNotLocal,
			permitGroupOperation,
			iff(isProvider('external'), preventPopulate),
		],
	},
	after: {
		all: [],
		find: [],
		get: [
			ifNotLocal(
				denyIfNotCurrentSchool({
					errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
				})
			),
		],
		create: [addWholeClassToCourse],
		update: [],
		patch: [addWholeClassToCourse],
		remove: [removeColumnBoard, removeContextExternalTools],
	},
};

module.exports = { courseService, courseHooks };
