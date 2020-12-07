const { courseModel } = require('../../../services/user-group/model');
const { updateManyResultDAO2BO } = require('./helper');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

// converter DAO 2 BO

const courseWithUserProjectionDAO2BO = ({ _id, student, substitutionTeacher, teacher }) => ({
	id: idToString(_id),
	student: student === true,
	teacher: teacher === true,
	substitutionTeacher: substitutionTeacher === true,
});

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
	return result.map(courseWithUserProjectionDAO2BO);
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

module.exports = {
	getCoursesWithUser,
	deleteUserFromCourseRelations,
};
