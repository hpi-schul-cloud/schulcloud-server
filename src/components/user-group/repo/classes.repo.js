const { classModel } = require('../../../services/user-group/model');
const { AssertionError, BadRequest } = require('../../../errors');
const { isValid: isValidObjectId, toString: idToString } = require('../../../helper/compare').ObjectId;
const missingParameters = require('../../../errors/helper/assertionErrorHelper');

const getUserQuery = (userId, classRole) => {
	if (classRole === 'student') {
		return { userIds: { $in: userId } };
	}
	if (classRole === 'teacher') {
		return { teacherIds: { $in: userId } };
	}

	throw new BadRequest(`User role ${classRole} is not valid role for classes`);
};

const validateRemoveUserFromClassesParams = (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(missingParameters({ userId }));
};

const filterClassMember = (userId) => ({
	$or: [
		{
			teacherIds: userId,
		},
		{
			userIds: userId,
		},
	],
});

const classIdWithUserProjection2BO = ({ _id, student, teacher }) => ({
	_id,
	id: idToString(_id),
	student: student === true,
	teacher: teacher === true,
});

const findClassesByUserAndClassRole = (userId, classRole) =>
	classModel.find(getUserQuery(userId, classRole)).lean().exec();

// PUBLIC
/**
 * Returns a list of class Id with the user role plays in it
 * @param {String|ObjectId} userId - the user's to check
 * @returns: {Array} An array of result objects
 */
const getClassesForUser = async (userId) => {
	const result = await classModel
		.aggregate([
			{ $match: filterClassMember(userId) },
			{
				$project: {
					teacher: {
						$in: [userId, '$teacherIds'],
					},
					student: {
						$in: [userId, '$userIds'],
					},
				},
			},
		])
		.exec();

	return result.map(classIdWithUserProjection2BO);
};

/**
 * Returns a list of class Id the user belongs to (as student)
 * @param {String|ObjectId} userId - the user's to check
 * @returns: {Array} Array of Class Business Objects
 */
const findClassesByStudent = async (userId) => {
	const searchResult = await findClassesByUserAndClassRole(userId, 'student');
	return searchResult;
};

/**
 * Returns a list of class Id the user belongs to (as teacher)
 * @param {String|ObjectId} userId - the user's to check
 * @returns: {Array} Array of Class Business Objects
 */
const findClassesByTeacher = async (teacherId) => {
	const searchResult = await findClassesByUserAndClassRole(teacherId, 'teacher');
	return searchResult;
};

/**
 * Removes the user for all classes he/she belongs to
 * @param {String|ObjectId} userId - the user's Id
 * @returns: {Object} Update Many Result Object
 */
const removeUserFromClasses = async (userId) => {
	validateRemoveUserFromClassesParams(userId);
	const filter = filterClassMember(userId);
	const updateResult = await classModel.updateMany(filter, { $pull: { teacherIds: userId, userIds: userId } }).exec();

	return updateResult; // TODO updateManyResultDAO2BO(updateResult);
};

const findClassById = (classId) => {
	const classItem = classModel.findById(classId).lean().exec();
	return classItem;
};

module.exports = {
	findClassById,
	getClassesForUser,
	findClassesByStudent,
	findClassesByTeacher,
	removeUserFromClasses,
};
