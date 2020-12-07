const { courseGroupModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');

const filterUserInUserGroups = (userId) => {
	return { userIds: userId };
};

const getCourseGroupsWithUser = async (userId) => {
	const result = await courseGroupModel.find(filterUserInUserGroups(userId)).lean().exec();
	// TODO convert DAO to BO
	return result;
};

const deleteUserFromUserGroups = async (userId) => {
	const filter = filterUserInUserGroups(userId);
	const result = await courseGroupModel.updateMany(filter, { $pull: { userIds: userId } }).exec();
	return updateManyResult(result);
};

module.exports = {
	getCourseGroupsWithUser,
	deleteUserFromUserGroups,
};
