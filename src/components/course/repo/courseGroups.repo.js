const { courseGroupModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('../../helper/repo.helper');

// converter DAO 2 BO

/**
 * Converts the DAO to an internal representation of course groups
 * @param {*} courseGroupDAO
 */
const courseGroupToBO = (courseGroupDAO) => ({ ...courseGroupDAO });

// filter

/**
 * Creates a filter object that relates course groups to users
 * @param {String|ObjectId} userId
 */
const filterUserInUserGroups = (userId) => ({ userIds: userId });

// public members

/**
 * Return a single course group item
 * @param {String} courseGroupId
 */
const getCourseGroupById = async (courseGroupId) => {
	const result = await courseGroupModel.findById(courseGroupId).lean().exec();
	return courseGroupToBO(result);
};

/**
 * Return course groups a user relates to
 * @param {String|ObjectId} userId
 */
const getCourseGroupsWithUser = async (userId) => {
	const result = await courseGroupModel.find(filterUserInUserGroups(userId)).lean().exec();
	return result.map(courseGroupToBO);
};

/**
 * Removes user relations from course groups for the given user
 * @param {String|ObjectId} userId
 */
const deleteUserFromUserGroups = async (userId) => {
	const filter = filterUserInUserGroups(userId);
	const result = await courseGroupModel.updateMany(filter, { $pull: { userIds: userId } }).exec();
	return updateManyResult(result);
};

module.exports = {
	getCourseGroupById,
	getCourseGroupsWithUser,
	deleteUserFromUserGroups,
};
