const { courseModel } = require('../../../services/user-group/model');
const { updateManyResultDAO2BO } = require('./helper');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

// converter

const dateToISOString = (mongooseDate) => {
	return mongooseDate.toISOString();
};

// converter DAO 2 BO

const courseWithUserProjectionDAO2BO = ({ _id, student, substituteTeacher, teacher }) => ({
	id: idToString(_id),
	student: student === true,
	teacher: teacher === true,
	substituteTeacher: substituteTeacher === true,
});

const courseDAO2BO = ({
	// externalSourceSchema
	source,
	sourceOptions,
	// userGroupSchema
	name,
	schoolId,
	userIds,
	// courseSchema
	_id,
	description,
	classIds = [],
	teacherIds = [],
	substitutionIds = [],
	ltiToolIds = [],
	color,
	startDate,
	untilDate,
	shareToken,
	times,
	isCopyFrom,
	features = [],
	// timestamps
	createdAt,
	updatedAt,
}) => {
	return {
		// externalSourceSchema
		source,
		sourceOptions,
		// userGroupSchema
		name,
		schoolId: idToString(schoolId),
		userIds: userIds.map(idToString),
		// courseSchema
		id: idToString(_id),
		description,
		classIds: classIds.map(idToString),
		teacherIds: teacherIds.map(idToString),
		substitutionIds: substitutionIds.map(idToString),
		ltiToolIds: ltiToolIds.map(idToString),
		color,
		startDate: dateToISOString(startDate),
		untilDate: dateToISOString(untilDate),
		shareToken,
		times,
		isCopyFrom,
		features,
		// timestamps
		createdAt: dateToISOString(createdAt),
		updatedAt: dateToISOString(updatedAt),
	};
};

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

/**
 *
 * @param {String|ObjectId} courseId
 */
const getCourseById = async (courseId) => {
	const result = await courseModel.findById(courseId).lean().exec();
	if (result !== null) return courseDAO2BO(result);
	return null;
};

module.exports = {
	getCoursesWithUser,
	getCourseById,
	deleteUserFromCourseRelations,
};
