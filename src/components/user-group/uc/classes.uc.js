const { classesRepo } = require('../repo');

const getClassesForStudent = async (userId) => {
	return classesRepo.findClassesByStudent(userId);
};

const getClassesForTeacher = async (userId) => {
	return classesRepo.findClassesByTeacher(userId);
};

const removeUserFromClasses = async (userId, classIds) => {
	return classesRepo.removeUserFromClasses(userId, classIds);
};

module.exports = {
	getClassesForStudent,
	getClassesForTeacher,
	removeUserFromClasses,
};
