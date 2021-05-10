const { schoolModel } = require('../../school/model');

const createSchool = async ({ name, systems, ldapSchoolIdentifier, currentYear, federalState, fileStorageType }) => {
	return schoolModel.create({
		name,
		systems,
		ldapSchoolIdentifier,
		currentYear,
		federalState,
		fileStorageType,
	});
};

const updateSchoolName = async (schoolId, schoolName) => {
	return schoolModel.findOneAndUpdate({ _id: schoolId }, { name: schoolName }, { new: true }).lean().exec();
};

const findSchoolByLdapIdAndSystem = async (ldapSchoolIdentifier, systems) => {
	return schoolModel
		.findOne({
			ldapSchoolIdentifier,
			systems: { $in: systems },
		})
		.lean()
		.exec();
};

const SchoolRepo = {
	createSchool,
	updateSchoolName,
	findSchoolByLdapIdAndSystem,
};

module.exports = SchoolRepo;
