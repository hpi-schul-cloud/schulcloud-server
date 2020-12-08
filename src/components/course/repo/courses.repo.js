const { courseModel } = require('../../../services/user-group/model');
const { updateManyResultDAO2BO } = require('./helper');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

// converter DAO 2 BO

const courseIdWithUserProjection2BO = ({ _id, student, substituteTeacher, teacher }) => ({
	_id,
	id: idToString(_id),
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
				$match: {
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
				},
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
	return result.map(courseIdWithUserProjection2BO);
};

const deleteUserFromCourseRelations = async (userId) => {
	const filter = {
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
	};
	const result = await courseModel
		.updateMany(filter, { $pull: { teacherIds: userId, substitutionIds: userId, userIds: userId } })
		.exec();
	return updateManyResultDAO2BO(result);
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
