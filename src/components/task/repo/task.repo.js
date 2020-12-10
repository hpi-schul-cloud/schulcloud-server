const { SubmissionModel, HomeworkModel } = require('../db');

const mapStatus = ({ ok, deletedCount, n, nModified }) => ({
	success: ok,
	modified: deletedCount === undefined ? nModified : deletedCount,
	// count: n,
});

/**
 * 	delete/modified operations should not allow null and undefined matches
 * @param {BSON|BsonString} userId
 * @throw {Error} for undefined and null
 */
const validateUserIdIsNotUnexpectedInput = (userId) => {
	if (!userId || userId === null) {
		throw new Error('The parameter "userId" is not defined.', userId);
	}
};

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
	validateUserIdIsNotUnexpectedInput(userId);
	const result = await HomeworkModel.deleteMany(privateHomeworkQuery(userId)).lean().exec();
	return mapStatus(result);
};

/**
 * @param {BSON|BsonString} userId
 * @return {Boolean}
 */
const replaceUserInPublicHomeworks = async (userId, replaceUserId) => {
	validateUserIdIsNotUnexpectedInput(userId);
	const result = await HomeworkModel.updateMany(publicHomeworkQuery(userId), { $set: { teacherId: replaceUserId } })
		.lean()
		.exec();
	return mapStatus(result);
};

/** Submissions */

const groupSubmissionQuery = (userId) => ({ $and: [{ teamMembers: userId }, { teamMembers: { $ne: null } }] });
const singleSubmissionQuery = (userId) => ({ $and: [{ studentId: userId }, { teamMembers: null }] });

/**
 * @param {BSON|BsonString} userId
 * @param {Array|String|StringList|MongooseSelectObject} [select]
 * @return {Array}
 */
const findGroupSubmissionsFromUser = async (userId, select) => {
	const result = await SubmissionModel.find(groupSubmissionQuery(userId), select).lean().exec();
	return result;
};

const findSingleSubmissionsFromUser = async (userId, select) => {
	const result = await SubmissionModel.find(singleSubmissionQuery(userId), select).lean().exec();
	return result;
};

const removeGroupSubmissionsConnectionsForUser = async (userId) => {
	validateUserIdIsNotUnexpectedInput(userId);
	const result = await SubmissionModel.updateMany(groupSubmissionQuery(userId), { $pull: { teamMembers: userId } })
		.lean()
		.exec();
	return mapStatus(result);
};

const deleteSingleSubmissionsFromUser = async (userId) => {
	validateUserIdIsNotUnexpectedInput(userId);
	const result = await SubmissionModel.removeMany(singleSubmissionQuery(userId)).lean().exec();
	return mapStatus(result);
};

module.exports = {
	findPrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	replaceUserInPublicHomeworks,
	findGroupSubmissionsFromUser,
	findSingleSubmissionsFromUser,
	removeGroupSubmissionsConnectionsForUser,
	deleteSingleSubmissionsFromUser,
};
