const { courseModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');

// TODO

const filterUserInProp = (userId, prop) => {
	return { [prop]: userId };
};

/**
 * Get courses with user
 * @param {string} userId
 */
const getCoursesWithProp = async (userId, prop) => {
	const filter = filterUserInProp(userId, prop);
	const result = await courseModel.find(filter).lean().exec();
	return result;
};

const deletePropFromCourseUsers = async (userId, prop) => {
	const filter = filterUserInProp(userId, prop);
	const result = await courseModel.updateMany(filter, {}).lean().exec();
	return updateManyResult(result);
};

const getCoursesWithUser = (userId) => {
	return getCoursesWithProp(userId, 'userId');
};
const deleteUserFromCourseUsers = (userId) => {
	return deletePropFromCourseUsers(userId, 'userId');
};

module.exports = { getCoursesWithUser, deleteUserFromCourseUsers };
