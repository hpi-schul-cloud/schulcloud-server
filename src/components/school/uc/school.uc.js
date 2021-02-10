const schoolRepo = require('../repo/school.repo');

const getSchool = async (id) => schoolRepo.getSchool(id);

const getTombstoneSchool = async () => schoolRepo.getTombstoneSchool();

const setTombstoneUser = async (schoolId, tombstoneUserId) => schoolRepo.setTombstoneUser(schoolId, tombstoneUserId);

const setStorageProvider = async (schoolId, storageProviderId, session) =>
	schoolRepo.setStorageProvider(schoolId, storageProviderId, session);

module.exports = {
	getSchool,
	getTombstoneSchool,
	setTombstoneUser,
	setStorageProvider,
};
