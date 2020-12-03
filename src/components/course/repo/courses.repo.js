const { courseModel } = require('../../../services/user-group/model');

// TODO

/**
 *
 * @param {*} userId
 * @param {*} prop
 */
const deleteUserIdFromCoursesProp = (userId, prop) => {
	// delete user within teacher
	// delete user within subteachers
	// delete user within userIds
	// return {
	//     [
	//         id:courseId
	//         teacher:bool
	//         subteacher:bool
	//         userIds:bool
	//     ]
	// }
};

// const getCourseGroupIdsByUserId = (userId) => {
// 	return [{ courseId: id, courseGroupIds: [courseGroupIds] }];
// };

// const deleteUserFromUserGroups = (userId, courseGroupIds) => {
// 	// coursegroupModel.updateMany
// 	// return courseGroupIds where the user has been removed
// };

module.exports = {};
