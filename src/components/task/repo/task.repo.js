const { SubmissionModel, HomeworkModel } = require('../db');

const privateHomeworkQuery = (userId) => ({ private: true, teacherId: userId });
const publicHomeworkQuery = (userId) => ({ private: false, teacherId: userId });

/**
 * @param {BSON|BsonString} userId
 * @param {Array|String|StringList|MongooseSelectObject} [select]
 * @return {Array}
 */
const findPrivateHomeworksFromUser = async (userId, select) => {
	const result = await HomeworkModel.find(privateHomeworkQuery(userId), select).lean().exec();
	return result;
};

/**
 * @param {BSON|BsonString} userId
 * @param {Array|String|StringList|MongooseSelectObject} [select]
 * @return {Array}
 */
const findPublicHomeworksFromUser = async (userId, select) => {
	const result = await HomeworkModel.find(publicHomeworkQuery(userId), select).lean().exec();
	return result;
};

/**
 * @param {BSON|BsonString} userId
 * @return {Boolean}
 */
const deletePrivateHomeworksFromUser = async (userId) => {
	const result = await HomeworkModel.deleteMany(privateHomeworkQuery(userId)).lean().exec();
	const success = result.ok === 1 && result.n === result.deletedCount;
	// TODO it sound bad to not give feedback over which ressources are deleted. A list of deleted _ids are also nice in this situation.
	return success;
};

/**
 * @param {BSON|BsonString} userId
 * @return {Boolean}
 */
const replaceUserInHomeworks = async (userId, replaceUserId) => {
	const result = await HomeworkModel.updateMany(publicHomeworkQuery(userId), { $set: { teacherId: replaceUserId } })
		.lean()
		.exec();
	const success = result.ok === 1 && result.n === result.nModified;
	return success;
};

module.exports = {
	findPrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	replaceUserInHomeworks,
};
