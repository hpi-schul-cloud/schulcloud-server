const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars

const { connect, close } = require('../src/utils/database');
const allCounties = require('./helpers/counties051120.json');
const logger = require('../src/logger');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const countySchema = new mongoose.Schema(
	{
		countyId: { type: Number },
		county: { type: String },
		licensePlate: [{ type: String }],
	},
	{
		timestamps: true,
	}
);
const CountyModel = mongoose.model('county', countySchema);

const federalStateModel = mongoose.model(
	'federalState',
	new mongoose.Schema({
		name: { type: String, required: true },
		abbreviation: { type: String, required: true },
		logoUrl: { type: String, required: true },
		counties: [{ type: countySchema }],
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	})
);

const getCounties = (stateId) => {
	const stateCounties = allCounties
		.filter((county) => county.federalId === JSON.stringify(stateId))
		.map((county) => {
			county.licensePlate = county.licensePlate.split(', ');
			return new CountyModel(county);
		});
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
		await federalStateModel.updateMany({}, { $pull: { counties: [] } });

		await CountyModel.deleteMany()
			.exec()
			.then((deletedCounties) => logger.info(`Down migration finished. \nDeleted ${deletedCounties.length} entries `))
			.catch((e) => logger.error('Down migration failed. Error: ', e));
		// ////////////////////////////////////////////////////
		await close();
	},
};
