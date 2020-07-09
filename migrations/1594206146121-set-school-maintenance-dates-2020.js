// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const federalStateModel = require('../src/services/federalState/model');
const { schoolModel } = require('../src/services/school/model');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

const maintenanceDates = {
	BW: new Date(2020, 6, 30),
	BY: new Date(2020, 6, 27),
	BE: new Date(2020, 5, 25),
	BB: new Date(2020, 5, 25),
	HB: new Date(2020, 6, 16),
	HH: new Date(2020, 5, 25),
	HE: new Date(2020, 6, 6),
	MV: new Date(2020, 5, 22),
	NI: new Date(2020, 6, 16),
	NW: new Date(2020, 5, 29),
	RP: new Date(2020, 6, 6),
	SL: new Date(2020, 6, 6),
	SN: new Date(2020, 6, 20),
	ST: new Date(2020, 6, 16),
	SH: new Date(2020, 5, 29),
	TH: new Date(2020, 6, 20),
	IN: new Date(2020, 6, 31),
};

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		const federalStates = await federalStateModel.find().exec();
		try {
			await Promise.all(federalStates.map(async (federalState) => {
				const maintenanceDate = maintenanceDates[federalState.abbreviation];
				return schoolModel.updateMany(
					{ federalState: federalState._id },
					{ inMaintenanceSince: maintenanceDate },
				).exec();
			}));
		} catch (err) {
			error(`Setting maintance dates failed: ${err.message}`);
		}
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await schoolModel.updateMany(
			{ federalState: { $ne: null } },
			{ $unset: { inMaintenanceSince: '' } },
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
