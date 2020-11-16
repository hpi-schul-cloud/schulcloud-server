const { schoolModel } = require('../school/model');
const federalStateModel = require('../federalState/model');
const { ObjectId } = require('mongoose').Types;

exports.getCounty = async (schoolId) => {
	let county;
	const school = await schoolModel.findById(schoolId);
	//const federalState = await federalStateModel.findById(school.federalState);
	const federalState = await federalStateModel.find({ 'counties._id': ObjectId(school.county) });
	//const county = federalState.counties.find((county) => equal(county._id, school.county));
	//const county = await federalStateModel.find({ 'counties._id': ObjectId(school.county) });
	if (federalState[0] && 'counties' in federalState[0]) {
		county = federalState[0].counties.id(school.county);
	}
	return county;
};
