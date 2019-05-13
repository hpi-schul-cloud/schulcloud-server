const _ = require('lodash');
const globalHooks = require('../../../hooks');
const ClassModel = require('../model').classModel;
const CourseModel = require('../model').courseModel;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);

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
	if ((requestBody.classIds || []).length > 0) { // just courses do have a property "classIds"
		return Promise.all(requestBody.classIds.map((classId) => {
			return ClassModel.findById(classId).exec().then(c => c.userIds);
		})).then(async (studentIds) => {
			// flatten deep arrays and remove duplicates
			studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

			await CourseModel.update(
				{ _id: course._id },
				{ $addToSet: { userIds: { $each: studentIds } } },
			).exec();
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
	return CourseModel.findById(courseId).exec().then((course) => {
		if (!course) return hook;

		const removedClasses = _.differenceBy(course.classIds, requestBody.classIds, v => JSON.stringify(v));
		if (removedClasses.length < 1) return hook;
		return Promise.all(removedClasses.map((classId) => {
			return ClassModel.findById(classId).exec().then(c => (c || []).userIds);
		})).then(async (studentIds) => {
			// flatten deep arrays and remove duplicates
			studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

			// remove class students from course DB and from hook body to not patch them back
			await CourseModel.update(
				{ _id: course._id },
				{ $pull: { userIds: { $in: studentIds } } },
				{ multi: true },
			).exec();
			hook.data.userIds = hook.data.userIds.filter(value => !studentIds.some(id => id.toString() === value));
			return hook;
		});
	});
};

const courseInviteHook = async (context) => {
	if (context.path === 'courses' && context.params.query && context.params.query.link) {
		const dbLink = await context.app.service('link').get(context.params.query.link); // link is used as "authorization"
		delete context.params.query.link;
		if (dbLink) return restrictToCurrentSchool(context);
	}

	return restrictToUsersOwnCourses(context);
};

const patchPermissionHook = async (context) => {
	const query = context.params.query || {};
	const defaultPermissionHook = globalHooks.hasPermission('USERGROUP_EDIT');

	if (query.link) {
		const dbLink = await context.app.service('link').get(query.link); // link is used as "authorization"
		delete context.params.query.link;
		if (dbLink) return context;
	}

	return defaultPermissionHook(context);
};

exports.before = {
	all: [
		globalHooks.authenticateJWT,
	],
	find: [
		globalHooks.hasPermission('USERGROUP_VIEW'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
	],
	get: [courseInviteHook],
	create: [
		globalHooks.injectUserId,
		globalHooks.hasPermission('USERGROUP_CREATE'),
		restrictToCurrentSchool,
	],
	update: [
		globalHooks.hasPermission('USERGROUP_EDIT'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
	],
	patch: [
		patchPermissionHook,
		restrictToCurrentSchool,
		globalHooks.permitGroupOperation,
		restrictToUsersOwnCourses,
		deleteWholeClassFromCourse,
	],
	remove: [
		globalHooks.hasPermission('USERGROUP_CREATE'),
		restrictToCurrentSchool,
		restrictToUsersOwnCourses,
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
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
};
