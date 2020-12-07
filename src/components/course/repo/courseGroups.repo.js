const { courseGroupModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');
const { toString } = require('../../../helper/compare').ObjectId;

const filterUserInUserGroups = (userId) => {
	return { userIds: userId };
};

const userGroupDAO2BO = ({ _id, name, schoolId, userIds = [], createdAt, updatedAt }) => {
	return {
		id: toString(_id),
		name,
		schoolId: toString(schoolId),
		userIds: userIds.map(toString),
		createdAt,
		updatedAt,
	};
};

const courseGroupDAO2BO = ({
	// userGroup
	_id,
	name,
	schoolId,
	userIds = [],
	createdAt,
	updatedAt,
	// courseGroup
	courseId,
}) => {
	const userGroupBo = userGroupDAO2BO({ _id, name, schoolId, userIds, createdAt, updatedAt });
	return {
		...userGroupBo,
		courseId: toString(courseId),
	};
};

/**
 *
 * @param {String} courseGroupId
 */
const getCourseGroupById = async (courseGroupId) => {
	const result = await courseGroupModel.findById(courseGroupId).lean().exec();
	return courseGroupDAO2BO(result);
};

const getCourseGroupsWithUser = async (userId) => {
	const result = await courseGroupModel.find(filterUserInUserGroups(userId)).lean().exec();
	return result.map(courseGroupDAO2BO);
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
