const _ = require('lodash');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const globalHooks = require('../../../hooks');
const ClassModel = require('../model').classModel;
const CourseModel = require('../model').courseModel;
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);

const { checkScopePermissions } = require('../../helpers/scopePermissions/hooks');

/**
 * adds all students to a course when a class is added to the course
 * @param hook - contains created/patched object and request body
 */
const addWholeClassToCourse = (hook) => {
	const requestBody = hook.data;
	const course = hook.result;
	if (requestBody.classIds === undefined) {
		return hook;
	}
	if ((requestBody.classIds || []).length > 0) {
		// just courses do have a property "classIds"
		return Promise.all(
			requestBody.classIds.map((classId) =>
				ClassModel.findById(classId)
					.exec()
					.then((c) => c.userIds)
			)
		).then(async (studentIds) => {
			// flatten deep arrays and remove duplicates
			studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

			await CourseModel.update({ _id: course._id }, { $addToSet: { userIds: { $each: studentIds } } }).exec();
			return hook;
		});
	}
	return hook;
};

/**
 * deletes all students from a course when a class is removed from the course
 * this function goes into a before hook before we have to check whether there is a class missing
 * in the patch-body which was in the course before
 * @param hook - contains and request body
 */
const deleteWholeClassFromCourse = (hook) => {
	const requestBody = hook.data;
	const courseId = hook.id;
	if (requestBody.classIds === undefined && requestBody.user === undefined) {
		return hook;
	}
	return CourseModel.findById(courseId)
		.exec()
		.then((course) => {
			if (!course) return hook;

			const removedClasses = _.differenceBy(course.classIds, requestBody.classIds, (v) => JSON.stringify(v));
			if (removedClasses.length < 1) return hook;
			return Promise.all(
				removedClasses.map((classId) =>
					ClassModel.findById(classId)
						.exec()
						.then((c) => (c || []).userIds)
				)
			).then(async (studentIds) => {
				// flatten deep arrays and remove duplicates
				studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

				// remove class students from course DB and from hook body to not patch them back
				await CourseModel.update(
					{ _id: course._id },
					{ $pull: { userIds: { $in: studentIds } } },
					{ multi: true }
				).exec();
				hook.data.userIds = hook.data.userIds.filter((value) => !studentIds.some((id) => equalIds(id, value)));
				return hook;
			});
		});
};

/**
 * remove all substitution teacher which are also teachers
 * @param hook - contains and request body
 */
const removeSubstitutionDuplicates = (hook) => {
	const requestBody = hook.data;
	if (requestBody.substitutionIds && (requestBody.substitutionIds || []).length > 0) {
		requestBody.substitutionIds = requestBody.substitutionIds.filter((val) => !requestBody.teacherIds.includes(val));
	}
};

const courseInviteHook = async (context) => {
	if (context.path === 'courses' && context.params.query && context.params.query.link) {
		// link is used as "authorization"
		const dbLink = await context.app.service('link').get(context.params.query.link);
		delete context.params.query.link;
		if (dbLink) return restrictToCurrentSchool(context);
	}

	return restrictToUsersOwnCourses(context);
};

const patchPermissionHook = async (context) => {
	const query = context.params.query || {};
	const defaultPermissionHook = (ctx) =>
		Promise.resolve(checkScopePermissions(['COURSE_EDIT'])(ctx)).then((_ctx) => restrictToUsersOwnCourses(_ctx));

	if (query.link) {
		const dbLink = await context.app.service('link').get(query.link); // link is used as "authorization"
		delete context.params.query.link;
		if (dbLink) return context;
	}

	return defaultPermissionHook(context);
};

/**
 * If the course is expired (archived), only the untilDate and startDate may be changed.
 * @param context contains the feathers context of the request
 */
const restrictChangesToArchivedCourse = async (context) => {
	const course = await context.app.service('courses').get(context.id);
	if (course.isArchived === false) {
		return context;
	}
	// course is expired
	const disallowedKeys = Object.keys(context.data).filter(
		(key) => !['untilDate', 'startDate', 'schoolId'].includes(key)
	);
	if (disallowedKeys.length > 0) {
		return Promise.reject(new BadRequest('This course is archived. To activate it, please change the end date.'));
	}
	return context;
};

module.exports = {
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	removeSubstitutionDuplicates,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
};
