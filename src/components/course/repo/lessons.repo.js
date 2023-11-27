const { lessonModel } = require('./db/lesson');
const { updateManyResult } = require('../../helper/repo.helper');

/**
 * Filter lessons by contents including the given user.
 * @param {string|ObjectId} userId
 */
const filterUserInContents = (userId) => ({ 'contents.user': userId });

/**
 * Returns lessons which have the given user related in lesson contents
 * @param {String|ObjectId} userId
 */
const getLessonsWithUserInContens = async (userId) => {
	const filter = filterUserInContents(userId);
	const result = await lessonModel.find(filter).lean().exec();
	return result;
};

/**
 * Removes a user from lesson.contents.userId
 * @param {string} userId
 */
const deleteUserFromLessonContents = async (userId) => {
	const filter = filterUserInContents(userId);
	const result = await lessonModel
		.updateMany(filter, { $unset: { 'contents.$[].user': '' } })
		.lean()
		.exec();
	return updateManyResult(result);
};

module.exports = { getLessonsWithUserInContens, deleteUserFromLessonContents };
