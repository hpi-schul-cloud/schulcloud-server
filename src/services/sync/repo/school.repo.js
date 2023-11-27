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

const findSchoolByPreviousExternalIdAndSystem = async (previousExternalId, systems) =>
	schoolModel
		.findOne({
			previousExternalId,
			systems: { $in: systems },
		})
		.populate('userLoginMigration')
		.lean({ virtuals: true })
		.exec();

const findSchoolByOfficialSchoolNumber = async (officialSchoolNumber) => {
	if (!officialSchoolNumber) {
		return;
	}
	// eslint-disable-next-line consistent-return
	return schoolModel.findOne({ officialSchoolNumber }).lean({ virtuals: true }).exec();
};

const getYears = async () => yearModel.find().lean().exec();

const findFederalState = async (abbreviation) => federalStateModel.findOne({ abbreviation }).lean().exec();

const SchoolRepo = {
	createSchool,
	updateSchoolName,
	findSchoolByLdapIdAndSystem,
	findSchoolByOfficialSchoolNumber,
	findSchoolByPreviousExternalIdAndSystem,
	getYears,
	findFederalState,
};

module.exports = SchoolRepo;
