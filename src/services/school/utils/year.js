const SchoolYearFacade = require('../logic/year');
const { yearModel: Years } = require('../model');


const getSchoolYearByPeriod = async (startDate, endDate, school) => {
	const defaultYears = await Years.find().lean().exec();
	const facade = new SchoolYearFacade(defaultYears, school);
	return facade.yearFromDate(startDate);
};

module.exports = {
	getSchoolYearByPeriod,
};
