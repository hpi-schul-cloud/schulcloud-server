const { schoolModel: School } = require('../../../services/school/model');
const { NotFound } = require('../../../errors');

const getSchool = async (_id) => {
	const school = await School.findOne({ _id }).lean().exec();
	if (school == null) {
		throw new NotFound('no school for this id');
	}
	return school;
};

const findSchools = async (selectCriteria) => {
	return School.find(selectCriteria).lean().exec();
};

const updateSchool = async (schoolId, schoolPatch) => {
	return School.findByIdAndUpdate(schoolId, schoolPatch, { new: true }).lean().exec();
};

module.exports = {
	getSchool,
	findSchools,
	updateSchool,
};
