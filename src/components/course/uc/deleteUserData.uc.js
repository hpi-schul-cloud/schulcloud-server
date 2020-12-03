const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { coursesRepo, lessonsRepo } = require('../repo/index');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');

const addLessonsToTrashbinData = (lessons = [], trashBinData) => {
	const lessonIds = lessons.map((lesson) => lesson._id);
	Object.assign(trashBinData, { lessonIds });
};

/**
 *
 * @param {string} userId
 */
const deleteUserData = async (userId) => {
	const trashBinData = [];
	let success = true;
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
	try {
		const courses = coursesRepo.getCoursesWithUserInUsers(userId);
	} catch (err) {
		// TODO
	}

	// delete user from lesson contents
	// see mapUser, seems not to be required anywhere (can be deleted)
	try {
		const lessons = await lessonsRepo.getLessonsWithUserInContens(userId);
		debug(`found ${lessons.length} lessons with contents of given user to be removed`);
		if (lessons.length !== 0) {
			addLessonsToTrashbinData(lessons, trashBinData);
			const result = await lessonsRepo.deleteUserFromLessonContents(userId);
			debug(`removed user from ${result.matchedDocuments} lessons`);
		}
	} catch (err) {
		// TODO await orchestrator
		success = false;
		throw err;
	}

	return { success, trashBinData };
};

module.exports = {
	deleteUserData,
};
