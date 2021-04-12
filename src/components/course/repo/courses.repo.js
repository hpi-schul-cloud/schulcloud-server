const { courseModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('../../helper/repo.helper');

// filter

/**
 * Filter for course membership of a user which can be a user, teacher, or substitution teacher in courses.
 * @param {String|ObjectId} userId
 */
const filterCourseMember = (userId) => ({
	$or: [
		{
			substitutionIds: userId,
		},
		{
			teacherIds: userId,
		},
		{
			userIds: userId,
		},
	],
});

// converter DAO 2 BO

/**
 * Creates a projection TO for users removed from courses. The flags student, teacher, and substituteTeacher are used to store from which list the user has been removed in the related course (_id).
 * @param {*} param0
 */
const courseIdWithUserProjectionTO = ({ _id, student, substituteTeacher, teacher }) => ({
	_id,
	student: student === true,
	teacher: teacher === true,
	substituteTeacher: substituteTeacher === true,
});

const course2BO = (courseDAO) => ({ ...courseDAO });

// public members

/**
 * Get courses with a user as member.
 * @see {filterCourseMember}
 * @param {String|ObjectId} userId
 */
const getCoursesWithUser = async (userId) => {
	const result = await courseModel
		.aggregate([
			{
				$match: filterCourseMember(userId),
			},
			{
				$project: {
					teacher: {
						$in: [userId, '$teacherIds'],
					},
					substituteTeacher: {
						$in: [userId, '$substitutionIds'],
					},
					student: {
						$in: [userId, '$userIds'],
					},
				},
			},
		])
		.exec();
	return result.map(courseIdWithUserProjectionTO);
};

/**
 * Removes a users membership from courses
 * @see {filterCourseMember}
 * @param {String|ObjectId} userId
 */
const deleteUserFromCourseRelations = async (userId) => {
	const filter = filterCourseMember(userId);
	const result = await courseModel
		.updateMany(filter, { $pull: { teacherIds: userId, substitutionIds: userId, userIds: userId } })
		.exec();
	return updateManyResult(result);
};

/**
 * Get a course by a course id
 * @param {String|ObjectId} courseId
 */
const getCourseById = async (courseId) => {
	const result = await courseModel.findById(courseId).lean().exec();
	if (result !== null) return course2BO(result);
	return null;
};

module.exports = {
	getCoursesWithUser,
	getCourseById,
	deleteUserFromCourseRelations,
};
