const { ApplicationError } = require('../../../errors');
const { coursesRepo, lessonsRepo, courseGroupsRepo } = require('../repo/index');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');

const addLessonsToTrashbinData = (lessons = [], trashBinData) => {
	const lessonIds = lessons.map((lesson) => lesson._id);
	Object.assign(trashBinData, { lessonIds });
};

const validateParams = (userId) => {
	// TODO add data into error
	if (!isValidObjectId(userId)) throw new ApplicationError('a valid objectId is required', { userId });
};

const deleteUserDatafromLessons = async (userId) => {
	validateParams(userId);
	debug(`deleting user mentions in lesson contents started`, { userId });
	// delete user from lesson contents
	// see mapUser, seems not to be required anywhere (can be deleted)
	const lessons = await lessonsRepo.getLessonsWithUserInContens(userId);
	debug(`found ${lessons.length} lessons with contents of given user to be removed`, { userId });
	const data = [];
	if (lessons.length !== 0) {
		addLessonsToTrashbinData(lessons, data);
		const result = await lessonsRepo.deleteUserFromLessonContents(userId);
		debug(`removed user from ${result.matchedDocuments} lessons`, { userId });
	}
	debug(`deleting user mentions in lesson contents finished`, { userId });
	return { trashBinData: { scope: 'lessons', data }, complete: true };
};

const addCoursesToData = (coursesAggreate = [], data) => {
	const student = coursesAggreate.filter((course) => course.student).map((course) => course._id);
	const teacher = coursesAggreate.filter((course) => course.teacher).map((course) => course._id);
	const substituteTeacher = coursesAggreate.filter((course) => course.substituteTeacher).map((course) => course._id);
	Object.assign(data, { courseIds: { student, teacher, substituteTeacher } });
};

const deleteUserDataFromCourses = async (userId) => {
	validateParams(userId);

	const data = [];
	const courses = await coursesRepo.getCoursesWithUser(userId);
	let complete = false;
	if (courses.length !== 0) {
		complete = await coursesRepo.deleteUserFromCourseRelations(userId).success;
		addCoursesToData(courses, data);
	}
	return { trashBinData: { scope: 'courses', data }, complete };
};

const addCourseGroupData = (courseGroupdata = [], data) => {
	const courseGroupIds = courseGroupdata.map((courseGroup) => courseGroup._id);
	Object.assign(data, courseGroupIds);
};

const deleteUserDataFromCourseGroups = async (userId) => {
	validateParams(userId);
	const data = [];
	const courseGroups = await courseGroupsRepo.getCourseGroupsWithUser(userId);
	if (courseGroups.length !== 0) {
		await courseGroupsRepo.deleteUserFromUserGroups(userId);
		addCourseGroupData(courseGroups, data);
	}

	return { trashBinData: { scope: 'courseGroups', data }, complete: true };
};

const deleteUserData = () => {
	return [deleteUserDataFromCourses, deleteUserDatafromLessons, deleteUserDataFromCourseGroups];
};

module.exports = { deleteUserData };
