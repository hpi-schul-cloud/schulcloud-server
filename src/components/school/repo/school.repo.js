const { schoolModel: School } = require('../../../services/school/model');

const { SCHOOL_OF_DELETE_USERS } = require('./db');
const { NotFound } = require('../../../errors');

const getSchool = async (_id) => {
	const school = await School.findById(_id).lean().exec();
	if (school == null) {
		throw new NotFound('no school for this id');
	}
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
