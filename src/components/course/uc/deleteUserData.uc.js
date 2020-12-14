const {
	deleteUserDataFromCourses,
	deleteUserDatafromLessons,
	deleteUserDataFromCourseGroups,
} = require('./deleteUserData/deleteUserDataSteps');

/**
 * Resolves with methods accepting a user-id. When all these methods are executed, this component will have all user relations removed.
 */
const deleteUserData = () => {
	return [deleteUserDataFromCourses, deleteUserDatafromLessons, deleteUserDataFromCourseGroups];
};

module.exports = { deleteUserData };
