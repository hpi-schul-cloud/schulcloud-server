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
		.lean({ virtuals: true })
		.exec();

// TODO ldap school number should not be taken just from the ou, but be part of the system ldap config definitions to get it
const findSchoolByOfficialSchoolNumber = async (officialSchoolNumber) =>
	schoolModel.find({ officialSchoolNumber }).exec();

const enableUserMigrationMode = async (schoolId, ldapSchoolIdentifier, system) => {
	schoolModel
		.findOneAndUpdate(
			{ _id: schoolId },
			{ ldapSchoolIdentifier, inUserMigration: true, $push: { systems: system } },
			{ new: true }
		)
		.lean()
		.exec();
};

const getYears = async () => yearModel.find().lean().exec();

const findFederalState = async (abbreviation) => federalStateModel.findOne({ abbreviation }).lean().exec();

const SchoolRepo = {
	createSchool,
	updateSchoolName,
	findSchoolByLdapIdAndSystem,
	findSchoolByOfficialSchoolNumber,
	enableUserMigrationMode,
	getYears,
	findFederalState,
};

module.exports = SchoolRepo;
