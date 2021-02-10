const { schoolModel: School } = require('../../../services/school/model');

const { SCHOOL_OF_DELETED_USERS } = require('./db');

const getSchool = async (_id) => School.findById(_id).lean().exec();

const getTombstoneSchool = async () => School.findOne({ purpose: SCHOOL_OF_DELETED_USERS.purpose }).lean().exec();

const setTombstoneUser = async (schoolId, tombstoneUserId) =>
	School.findByIdAndUpdate(schoolId, { tombstoneUserId }, { new: true }).lean().exec();

const setStorageProvider = async (schoolId, storageProviderId, session) => {
	return School
		.findByIdAndUpdate(schoolId, { $set: { storageProvider: storageProviderId } })
		.session(session)
		.lean()
		.exec(),
};

module.exports = {
	getSchool,
	getTombstoneSchool,
	setTombstoneUser,
	setStorageProvider,
};
