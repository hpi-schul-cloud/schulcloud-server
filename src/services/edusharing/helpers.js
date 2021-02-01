const { schoolModel } = require('../school/model');

exports.getCounty = async (schoolId) => {
	const school = await schoolModel.findById(schoolId);
	return school.county;
};
