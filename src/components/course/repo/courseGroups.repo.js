const { courseGroupModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');

// converter DAO 2 BO

const courseGroupToBO = (courseGroupDAO) => {
	return { ...courseGroupDAO };
};

// filter

const filterUserInUserGroups = (userId) => {
	return { userIds: userId };
};

// public members

/**
 *
 * @param {String} courseGroupId
 */
const getCourseGroupById = async (courseGroupId) => {
	const result = await courseGroupModel.findById(courseGroupId).lean().exec();
	return courseGroupToBO(result);
};

const getCourseGroupsWithUser = async (userId) => {
	const result = await courseGroupModel.find(filterUserInUserGroups(userId)).lean().exec();
	return result.map(courseGroupToBO);
};

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
