const { schoolModel: School } = require('../../../services/school/model');

const { SCHOOL_OF_DELETE_USERS } = require('./db');

const getSchool = async (_id) => {
	const school = await School.findById(_id).lean().exec();
	return school;
};

const getTombstoneSchool = async () => School.findOne({ purpose: SCHOOL_OF_DELETE_USERS.purpose }).lean().exec();

const setTombstoneUser = async (schoolId, tombstoneUserId) =>
	School.findByIdAndUpdate(schoolId, { tombstoneUserId }, { new: true }).lean().exec();

module.exports = {
	getSchool,
	getTombstoneSchool,
	setTombstoneUser,
};
