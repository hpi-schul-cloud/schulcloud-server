const { classModel } = require('../../user-group/model');

const findClassByYearAndLdapDn = async (year, ldapDN) => {
	return classModel
		.findOne({
			year,
			ldapDN,
		})
		.lean()
		.exec();
};

const createClass = async (newClass) => {
	return classModel.create({
		name: newClass.className,
		schoolId: newClass.schoolId,
		nameFormat: newClass.nameFormat,
		ldapDN: newClass.ldapDn,
		year: newClass.year,
	});
};

const updateClassName = async (classId, className) => {
	return classModel.findOneAndUpdate({ _id: classId }, { name: className }, { new: true }).lean().exec();
};

const ClassRepo = {
	findClassByYearAndLdapDn,
	createClass,
	updateClassName,
};

module.exports = ClassRepo;
