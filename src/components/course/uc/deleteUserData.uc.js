const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { coursesRepo, lessonsRepo } = require('../repo/index');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');

const addLessonsToTrashbinData = (lessons = [], trashBinData) => {
	const lessonIds = lessons.map((lesson) => lesson._id);
	Object.assign(trashBinData, { lessonIds });
};

const deleteUserDatafromLessons = async (userId) => {
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

const deleteUyserDataFromCourses = async (userId) => {
	// TODO permissions

	// delete user relations from course:
	// (userIds[ObjectId], teacherIds[ObjectId], substitutionIds[ObjectId])
	// add to trashbin

	// delete user relations from course groups:
	// (userIds[ObjectId])

	// add to trashbin:
	// courses: [{
	//  id: courseId
	// 	user: Boolean,
	// 	teacher: Boolean,
	// 	substitutionTeacher: Boolean
	// 	courseGroups: [courseGroupIds]
	// }]
	//
	const data = [];
	const courses = coursesRepo.getCoursesWithUserInUsers(userId);

	return { trashBinData: { scope: 'courses', data }, complete: true };
};

module.exports = [deleteUserDatafromLessons, deleteUyserDataFromCourses];
