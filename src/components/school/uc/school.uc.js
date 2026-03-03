const schoolRepo = require('../repo/school.repo');

const getSchool = async (id) => schoolRepo.getSchool(id);

const getTombstoneSchool = async () => schoolRepo.getTombstoneSchool();

const getStorageProviderIdForSchool = async (schoolId) => schoolRepo.getStorageProviderIdForSchool(schoolId);

const setTombstoneUser = async (schoolId, tombstoneUserId) => schoolRepo.setTombstoneUser(schoolId, tombstoneUserId);

module.exports = {
	getSchool,
	getTombstoneSchool,
	getStorageProviderIdForSchool,
	setTombstoneUser,
};
