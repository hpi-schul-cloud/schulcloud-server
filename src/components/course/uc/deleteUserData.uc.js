const {
	deleteUserDataFromCourses,
	deleteUserDatafromLessons,
	deleteUserDataFromCourseGroups,
} = require('./deleteUserData/deleteUserDataSteps');

const deleteUserData = () => {
	return [deleteUserDataFromCourses, deleteUserDatafromLessons, deleteUserDataFromCourseGroups];
};

module.exports = { deleteUserData };
