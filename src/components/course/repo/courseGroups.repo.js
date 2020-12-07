const { courseGroupModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');

const filterUserInUserGroups = (userId) => {
	return { userIds: userId };
};

const getCourseGroupsWithUser = async (userId) => {
	// TODO Do we always need to take schoolId into consideration?
	const result = await courseGroupModel.find(filterUserInUserGroups(userId)).lean().exec();

	return result;
};

const deleteUserFromUserGroups = async (userId) => {
	const filter = filterUserInUserGroups(userId);
	const result = await courseGroupModel
		.updateMany(filter, { $pull: { userIds: userId } })
		.lean() // Do we really need it?
		.exec();
	return updateManyResult(result);
};

module.exports = {
	getCourseGroupsWithUser,
	deleteUserFromUserGroups,
};
