const { schoolModel: School } = require('../../../services/school/model');

const { SCHOOL_OF_DELETED_USERS } = require('./db');

const getSchool = async (_id) => School.findById(_id).lean().exec();

const getTombstoneSchool = async () => School.findOne({ purpose: SCHOOL_OF_DELETED_USERS.purpose }).lean().exec();

const getStorageProviderIdForSchool = async (schoolId) => {
	const school = await School.findById(schoolId).select('storageProvider').lean().exec();
	return school.storageProvider;
}

const setTombstoneUser = async (schoolId, tombstoneUserId) =>
	School.findByIdAndUpdate(schoolId, { tombstoneUserId }, { new: true }).lean().exec();

module.exports = {
	getSchool,
	getTombstoneSchool,
	getStorageProviderIdForSchool,
	setTombstoneUser,
};
