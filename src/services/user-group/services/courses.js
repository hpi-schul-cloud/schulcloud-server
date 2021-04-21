const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
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
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
	removeSubstitutionDuplicates,
} = require('../hooks/courses');

const { checkScopePermissions } = require('../../helpers/scopePermissions/hooks');
const { defaultWhitelist } = require('../../../utils/whitelist');

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
	multi: true,
	whitelist: defaultWhitelist,
});

const populateWhitelist = {
	classIds: ['_id', 'displayName'],
	userIds: ['_id', 'firstName', 'lastName', 'fullName'],
	teacherIds: ['_id', 'firstName', 'lastName'],
};

const courseHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [
			hasPermission('COURSE_VIEW'),
			restrictToCurrentSchoolIfNotLocal,
			restrictToUsersOwnCoursesIfNotLocal,
			iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
			mapPaginationQuery,
			addCollation,
		],
		get: [courseInviteHook, iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist))],
		create: [
			injectUserId,
			hasPermission('COURSE_CREATE'),
			removeSubstitutionDuplicates,
			restrictToCurrentSchoolIfNotLocal,
			iff(isProvider('external'), preventPopulate),
		],
		update: [
			checkScopePermissions(['COURSE_EDIT']),
			restrictToCurrentSchoolIfNotLocal,
			restrictToUsersOwnCoursesIfNotLocal,
			restrictChangesToArchivedCourse,
			iff(isProvider('external'), preventPopulate),
		],
		patch: [
			patchPermissionHook,
			restrictToCurrentSchoolIfNotLocal,
			restrictChangesToArchivedCourse,
			permitGroupOperation,
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
		remove: [],
	},
};

module.exports = { courseService, courseHooks };
