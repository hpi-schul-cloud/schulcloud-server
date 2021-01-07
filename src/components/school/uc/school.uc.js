const schoolRepo = require('../repo/school.repo');

const getSchool = async (id) => schoolRepo.getSchool(id);

const getTombstoneSchool = async () => {
	return schoolRepo.getTombstoneSchool();
};

const setTombstoneUser = async (schoolId, tombstoneUserId) => schoolRepo.setTombstoneUser(schoolId, tombstoneUserId);

module.exports = {
	getSchool,
	getTombstoneSchool,
	setTombstoneUser,
};
