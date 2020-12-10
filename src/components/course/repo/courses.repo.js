const { courseModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

// filter

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

const courseIdWithUserProjectionTO = ({ _id, student, substituteTeacher, teacher }) => ({
	_id,
	student: student === true,
	teacher: teacher === true,
	substituteTeacher: substituteTeacher === true,
});

const course2BO = (courseDAO) => ({ ...courseDAO });

// public members

/**
 *
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

const deleteUserFromCourseRelations = async (userId) => {
	const filter = filterCourseMember(userId);
	const result = await courseModel
		.updateMany(filter, { $pull: { teacherIds: userId, substitutionIds: userId, userIds: userId } })
		.exec();
	return updateManyResult(result);
};

/**
 *
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
