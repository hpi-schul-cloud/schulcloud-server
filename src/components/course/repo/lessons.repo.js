const { lessonModel } = require('./db/lesson');

const updateManyResult = ({ n, nModified, ok }) => {
	return { success: ok === 1, matchedDocuments: n, modifiedDocuments: nModified };
};

/**
 * Filter lessons by contents including the given userId.
 * @param {string|ObjectId} userId
 */
const filterUserInContents = (userId) => ({ 'contents.user': userId });

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
