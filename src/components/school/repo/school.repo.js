const { schoolModel: School } = require('../../../services/school/model');

const { SCHOOL_OF_DELETED_USERS } = require('./db');

const getSchool = async (_id) => School.findById(_id).lean().exec();

const getTombstoneSchool = async () => School.findOne({ purpose: SCHOOL_OF_DELETED_USERS.purpose }).lean().exec();

const setTombstoneUser = async (schoolId, tombstoneUserId) =>
	School.findByIdAndUpdate(schoolId, { tombstoneUserId }, { new: true }).lean().exec();

const create = async (schoolData) => School.create(schoolData);

const remove = async (school) => School.remove(school);

const updateName = async (schoolId, schoolName) =>
	School.findByIdAndUpdate(schoolId, { name: schoolName }, { new: true }).lean().exec();

const findByLdapIdAndSystem = async (ldapSchoolIdentifier, systems) =>
	School.findOne({
		ldapSchoolIdentifier,
		systems: { $in: systems },
	})
		.lean()
		.exec();

module.exports = {
	create,
	remove,
	updateName,
	getSchool,
	getTombstoneSchool,
	setTombstoneUser,
	findByLdapIdAndSystem,
};
