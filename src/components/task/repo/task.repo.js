const { SubmissionModel, HomeworkModel } = require('../db');

const mapStatus = ({ ok, deletedCount, n, nModified }) => ({
	success: ok,
	modified: deletedCount === undefined ? nModified : deletedCount,
	count: n,
});

/** Homeworks */
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
	return mapStatus(result);
};

/**
 * @param {BSON|BsonString} userId
 * @return {Boolean}
 */
const replaceUserInPublicHomeworks = async (userId, replaceUserId) => {
	const result = await HomeworkModel.updateMany(publicHomeworkQuery(userId), { $set: { teacherId: replaceUserId } })
		.lean()
		.exec();
	return mapStatus(result);
};

/** Submissions */

const groupSubmissionQuery = (userId) => ({ $and: [{ teamMembers: userId }, { teamMembers: { $ne: null } }] });
/**
 * @param {BSON|BsonString} userId
 * @param {Array|String|StringList|MongooseSelectObject} [select]
 * @return {Array}
 */
const findGroupSubmissionsFromUser = async (userId, select) => {
	const result = await SubmissionModel.find(groupSubmissionQuery(userId), select).lean().exec();
	return result;
};

module.exports = {
	findPrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	replaceUserInPublicHomeworks,
	findGroupSubmissionsFromUser,
};
