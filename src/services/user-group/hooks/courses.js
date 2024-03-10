const _ = require('lodash');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const moment = require('moment');

const { BadRequest, Forbidden } = require('../../../errors');
const globalHooks = require('../../../hooks');
const ClassModel = require('../model').classModel;
const CourseModel = require('../model').courseModel;
const { equal: equalIds, toString: toStringId } = require('../../../helper/compare').ObjectId;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);

const { checkScopePermissions } = require('../../helpers/scopePermissions/hooks');
/**
 * adds all students to a course when a class is added to the course
 * @param hook - contains created/patched object and request body
 */
const splitClassIdsInGroupsAndClasses = async (hook) => {
	if (!Configuration.get('FEATURE_GROUPS_IN_COURSE_ENABLED')) {
		return;
	}

	const { app } = hook;
	const requestBody = hook.data;

	if ((requestBody.classIds || []).length > 0) {
		const groups = await Promise.allSettled(
			requestBody.classIds.map((classId) => app.service('nest-group-service').findById(classId))
		).then(async (promiseResults) => {
			const successfullPromises = promiseResults.filter((result) => result.status === 'fulfilled');
			const foundGroups = successfullPromises.map((result) => result.value);

			return foundGroups;
		});

		let classes = await Promise.all(requestBody.classIds.map((classId) => ClassModel.findById(classId).exec()));
		classes = classes.filter((clazz) => clazz !== null);

		requestBody.groupIds = groups.map((group) => group.id);
		requestBody.classIds = classes.map((clazz) => clazz._id);
	}
};

const addWholeClassToCourse = async (hook) => {
	const { app } = hook;
	const requestBody = hook.data;
	const course = hook.result;

	if (Configuration.get('FEATURE_GROUPS_IN_COURSE_ENABLED') && (requestBody.groupIds || []).length > 0) {
		await Promise.all(
			requestBody.groupIds.map((groupId) =>
				app
					.service('nest-group-service')
					.findById(groupId)
					.then((group) => group.users)
			)
		).then(async (groupUsers) => {
			// flatten deep arrays and remove duplicates
			const userIds = _.flattenDeep(groupUsers).map((groupUser) => groupUser.userId);
			const uniqueUserIds = _.uniqWith(userIds, (a, b) => a === b);

			await CourseModel.update({ _id: course._id }, { $addToSet: { userIds: { $each: uniqueUserIds } } }).exec();

			return undefined;
		});
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
	const { app } = hook;
	const requestBody = hook.data;
	const courseId = hook.id;
	if (requestBody.classIds === undefined && requestBody.user === undefined && requestBody.groupIds === undefined) {
		return hook;
	}
	return CourseModel.findById(courseId)
		.exec()
		.then(async (course) => {
			if (!course) return hook;

			const removedGroups = _.differenceBy(course.groupIds, requestBody.groupIds, (v) => JSON.stringify(v));
			if (Configuration.get('FEATURE_GROUPS_IN_COURSE_ENABLED') && removedGroups.length > 0) {
				await Promise.all(
					removedGroups.map((groupId) =>
						app
							.service('nest-group-service')
							.findById(groupId)
							.then((group) => group.users)
					)
				).then(async (groupUsers) => {
					// flatten deep arrays and remove duplicates
					const userIds = _.flattenDeep(groupUsers).map((groupUser) => groupUser.userId);
					const uniqueUserIds = _.uniqWith(userIds, (a, b) => a === b);

					await CourseModel.update(
						{ _id: course._id },
						{ $pull: { userIds: { $in: uniqueUserIds } } },
						{ multi: true }
					).exec();
					hook.data.userIds = hook.data.userIds.filter((value) => !uniqueUserIds.some((id) => equalIds(id, value)));

					return undefined;
				});
			}

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

const compareIdArr = (arr1, arr2) => {
	if (arr1.length !== arr2.length) {
		return false;
	}
	return arr1.every((element) => arr2.includes(toStringId(element)));
};

const restrictChangesToSyncedCourse = async (hook) => {
	const { app } = hook;
	const courseId = hook.id;
	const course = await app.service('courses').get(courseId);

	if (course.syncedWithGroup) {
		const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';
		const courseStartDate = course.startDate ? moment.utc(course.startDate).format(dateFormat) : undefined;
		const courseUntilDate = course.untilDate ? moment.utc(course.untilDate).format(dateFormat) : undefined;

		if (
			compareIdArr(course.classIds, hook.data.classIds) &&
			compareIdArr(course.groupIds, hook.data.groupIds) &&
			compareIdArr(course.substitutionIds, hook.data.substitutionIds) &&
			compareIdArr(course.teacherIds, hook.data.teacherIds) &&
			courseStartDate === hook.data.startDate &&
			courseUntilDate === hook.data.untilDate
		) {
			return hook;
		}
		throw new Forbidden("The course doesn't match the synchronized course");
	}
	return hook;
};

const removeColumnBoard = async (context) => {
	const courseId = context.id;
	await context.app.service('nest-column-board-service').deleteByCourseId(courseId);
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
	splitClassIdsInGroupsAndClasses,
	addWholeClassToCourse,
	deleteWholeClassFromCourse,
	removeColumnBoard,
	removeSubstitutionDuplicates,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
	restrictChangesToSyncedCourse,
};
