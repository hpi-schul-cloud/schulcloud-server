const { classesRepo } = require('../repo');

const getClassesForStudent = async (userId) => {
	return classesRepo.getClassesForStudent(userId);
};

const getClassesForTeacher = async (userId) => {
	return classesRepo.getClassesForTeacher(userId);
};

const removeStudentFromClasses = async (userId, classIds) => {
	return classesRepo.removeStudentFromClasses(userId, classIds);
};

const removeTeacherFromClasses = async (userId, classIds) => {
	return classesRepo.removeTeacherFromClasses(userId, classIds);
};

module.exports = {
	getClassesForStudent,
	getClassesForTeacher,
	removeStudentFromClasses,
	removeTeacherFromClasses,
};
