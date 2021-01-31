const { schoolModel } = require('../school/schools.model');

exports.getCounty = async (schoolId) => {
	const school = await schoolModel.findById(schoolId);
	return school.county;
};
