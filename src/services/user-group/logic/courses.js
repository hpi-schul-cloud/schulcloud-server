
const getAllCourseUserIds = ({ userIds = [], teacherIds = [], substitutionIds = [] }) => {
	return userIds.concat(teacherIds).concat(substitutionIds);
};

module.exports = {
	getAllCourseUserIds: getAllCourseUserIds
};
