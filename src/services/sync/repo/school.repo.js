const federalStateModel = require('../../federalState/model');
const { schoolModel, yearModel } = require('../../school/model');

const createSchool = async ({ name, systems, ldapSchoolIdentifier, currentYear, federalState, fileStorageType }) =>
	schoolModel.create({
		name,
		systems,
		ldapSchoolIdentifier,
		currentYear,
		federalState,
		fileStorageType,
	});

const updateSchoolName = async (schoolId, schoolName) =>
	schoolModel.findOneAndUpdate({ _id: schoolId }, { name: schoolName }, { new: true }).lean().exec();

const findSchoolByLdapIdAndSystem = async (ldapSchoolIdentifier, systems) =>
	schoolModel
		.findOne({
			ldapSchoolIdentifier,
			systems: { $in: systems },
		})
		.lean()
		.exec();

const getYears = async () => yearModel.find().lean().exec();

const findFederalState = async (abbreviation) => federalStateModel.findOne({ abbreviation }).lean().exec();

const SchoolRepo = {
	createSchool,
	updateSchoolName,
	findSchoolByLdapIdAndSystem,
	getYears,
	findFederalState,
};

module.exports = SchoolRepo;
