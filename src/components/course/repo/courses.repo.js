const { courseModel } = require('../../../services/user-group/model');
const { updateManyResult } = require('./helper');


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
	return result;
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
	return updateManyResult(result);
}

module.exports = {
	getCoursesWithUser,
	deleteUserFromCourseRelations,
};
