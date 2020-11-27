const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars

const { connect, close } = require('../src/utils/database');
const allCounties = require('./helpers/counties051120.json');
const { countySchema } = require('./../src/services/federalState/countyModel.js');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const CountyModel = mongoose.model('county', countySchema);

const federalStateModel = mongoose.model(
	'federalState',
	new mongoose.Schema({
		counties: [{ type: countySchema }],
	})
);

const getCounties = (stateId) => {
	const stateCounties = allCounties
		.filter((county) => JSON.stringify(county.federalId) === JSON.stringify(stateId))
		.map((county) => new CountyModel(county));
	return stateCounties;
};

module.exports = {
	up: async function up() {
		await connect();
		const federalStates = await federalStateModel.find({});
		await Promise.all(
			federalStates.map((state) => {
				const counties = getCounties(state._id);
				if (counties.length) {
					state.counties.push(...counties);
				}
				return state.save();
			})
		);
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await federalStateModel.updateMany({}, { $set: { counties: [] } });
		await CountyModel.deleteMany().exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
