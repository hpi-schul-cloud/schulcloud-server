const { yearModel: YearModel, schoolModel: SchoolModel } = require('../services/school/model');

class Year

module.exports = {
	defaultYears: () => {
		const years = YearModel.find().exec();
	},
	customYears: async (schoolId) => {
		const school = await SchoolModel.findById(schoolId).lean().exec();
		if (school == null) {
			throw new Error('could not resolve given schoolId');
		}
		const { customYears, currentYear } = school;
		if (currentYear) {
			throw new Error('The current year must be set in school settings!');
		}
	},

};
