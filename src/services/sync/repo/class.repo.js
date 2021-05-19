const { classModel } = require('../../user-group/model');

const findClassByYearAndLdapDn = async (year, ldapDN) =>
	classModel
		.findOne({
			year,
			ldapDN,
		})
		.lean()
		.exec();

const createClass = async (classData, school) => {
	return classModel.create({
		name: classData.name,
		schoolId: school._id,
		nameFormat: 'static',
		ldapDN: classData.ldapDN,
		year: school.currentYear,
	});
};

const updateClassName = async (classId, className) =>
	classModel.findOneAndUpdate({ _id: classId }, { name: className }, { new: true }).lean().exec();

const updateClassStudents = async (classId, students) =>
	classModel.findOneAndUpdate({ _id: classId }, { userIds: students }, { new: true }).lean().exec();

const updateClassTeachers = async (classId, teachers) =>
	classModel.findOneAndUpdate({ _id: classId }, { teacherIds: teachers }, { new: true }).lean().exec();

const ClassRepo = {
	findClassByYearAndLdapDn,
	createClass,
	updateClassName,
	updateClassStudents,
	updateClassTeachers,
};

module.exports = ClassRepo;
