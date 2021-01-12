const { ValidationError } = require('../../../../errors');
const { coursesRepo, lessonsRepo, courseGroupsRepo } = require('../../repo/index');
const { equal, isValid: isValidObjectId } = require('../../../../helper/compare').ObjectId;
const { debug } = require('../../../../logger');

const addLessonContentsToTrashbinData = (userId, lessons = [], trashBinData) => {
	const lessonIdsWithUserContentsIds = lessons.map((lesson) => {
		const { _id: lessonId, contents } = lesson;
		const usersContentIds = contents.filter((content) => equal(content.user, userId)).map((content) => content._id);
		return {
			lessonId,
			contentIds: usersContentIds,
		};
	});
	Object.assign(trashBinData, lessonIdsWithUserContentsIds);
};

const validateParams = (userId) => {
	if (!isValidObjectId(userId)) throw new ValidationError('a valid objectId is required', { userId });
};

/**
 * Removes a users relation from lessons and resolves with the related lessons in data of trashBinData.
 * complete may indicate that all batches have been succeded
 * @param {String|ObjectId} userId
 */
const deleteUserDatafromLessons = async (userId) => {
	validateParams(userId);

	const data = [];
	let complete = true;
	const lessons = await lessonsRepo.getLessonsWithUserInContens(userId);
	debug(`found ${lessons.length} lessons with contents of given user to be removed`, { userId });
	if (lessons.length !== 0) {
		addLessonContentsToTrashbinData(userId, lessons, data);
		const result = await lessonsRepo.deleteUserFromLessonContents(userId);
		complete = result.success;
		debug(`removed user from ${result.modifiedDocuments} lessons`, { userId });
	}
	return { trashBinData: { scope: 'lessons', data }, complete };
};

const addCoursesToData = (coursesAggreate = [], data) => {
	const student = coursesAggreate.filter((course) => course.student).map((course) => course._id);
	const teacher = coursesAggreate.filter((course) => course.teacher).map((course) => course._id);
	const substituteTeacher = coursesAggreate.filter((course) => course.substituteTeacher).map((course) => course._id);
	Object.assign(data, { student, teacher, substituteTeacher });
};

/**
 * Removes a users relations from courses and resolves with the related courses in data of trashBinData.
 * complete may indicate that all batches have been succeded
 * @param {String|ObjectId} userId
 */
const deleteUserDataFromCourses = async (userId) => {
	validateParams(userId);

	const data = {};
	let complete = true;
	const courses = await coursesRepo.getCoursesWithUser(userId);
	debug(`found ${courses.length} courses of given user to be removed`, { userId });
	if (courses.length !== 0) {
		const result = await coursesRepo.deleteUserFromCourseRelations(userId);
		debug(`removed user from ${result.modifiedDocuments} courses`, { userId });
		complete = result.success;
		addCoursesToData(courses, data);
	}
	return { trashBinData: { scope: 'courses', data }, complete };
};

const addCourseGroupData = (courseGroupdata = [], data) => {
	const courseGroupIds = courseGroupdata.map((courseGroup) => courseGroup._id);
	data.push(...courseGroupIds);
};

/**
 * Removes a users relations from course groups and resolves with the related course groups in data of trashBinData.
 * complete may indicate that all batches have been succeded
 * @param {*} userId
 */
const deleteUserDataFromCourseGroups = async (userId) => {
	validateParams(userId);
	const data = [];
	let complete = true;
	const courseGroups = await courseGroupsRepo.getCourseGroupsWithUser(userId);
	debug(`found ${courseGroups.length} course groups of given user to be removed`, { userId });
	if (courseGroups.length !== 0) {
		const result = await courseGroupsRepo.deleteUserFromUserGroups(userId);
		debug(`removed user from ${result.modifiedDocuments} course groups`, { userId });
		complete = result.success;
		addCourseGroupData(courseGroups, data);
	}

	return { trashBinData: { scope: 'courseGroups', data }, complete };
};

module.exports = { deleteUserDataFromCourses, deleteUserDataFromCourseGroups, deleteUserDatafromLessons };
