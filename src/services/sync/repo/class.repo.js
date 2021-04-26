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
	return classModel.create(newClass);
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
