const { classModel } = require('../../../services/user-group/model');
const { GeneralError, BadRequest } = require('../../../errors');

const getUserQuery = (userRole, userId) => {
	if (userRole === 'student') {
		return { userIds: { $in: userId } };
	}
	if (userRole === 'teacher') {
		return { teacherIds: { $in: userId } };
	}

	throw new BadRequest(`User role ${userRole} is not valid role for classes`);
};

const getClassesForUser = async (userId, userRole = 'student') => {
	return classModel.find(getUserQuery(userRole, userId)).lean().exec();
};

const getClassesForStudent = async (userId) => {
	return getClassesForUser(userId, 'student');
};

const getClassesForTeacher = async (teacherId) => {
	return getClassesForUser(teacherId, 'teacher');
};

const removeUserFromClasses = async (userId, userRole, classIds) => {
	const updateResult = await classModel
		.updateMany(
			{
				_id: { $in: classIds },
			},
			{ $pull: getUserQuery(userRole, userId) }
		)
		.lean()
		.exec();
	if (updateResult.nModified !== classIds.length) {
		throw new BadRequest(`some class doesn't contains the requested user`);
	} else if (updateResult.n !== updateResult.ok || updateResult.ok !== classIds.length) {
		throw new GeneralError(`db error during updating classes`);
	}

	return classIds;
};

const removeStudentFromClasses = async (userId, classIds) => {
	return removeUserFromClasses(userId, 'student', classIds);
};

const removeTeacherFromClasses = async (userId, classIds) => {
	return removeUserFromClasses(userId, 'teacher', classIds);
};

module.exports = {
	getClassesForStudent,
	getClassesForTeacher,
	removeStudentFromClasses,
	removeTeacherFromClasses,
};
