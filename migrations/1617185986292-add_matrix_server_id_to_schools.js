const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { SCHOOL_FEATURES } = require('../src/school/model');


// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const School = mongoose.model(
	'schools31032021',
	schoolModel,
	'schools'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		// School which use the Matrix Messenger have to be assigned to a specific matrix server.
		// Get schools with messenger activated, without mxId (this applies only for the beta schools).
		// => Set mxId = 1
		alert(`update schools with mxId`);
		await School.updateMany(
			{
				features: SCHOOL_FEATURES.MESSENGER,
				mxId: { $exists: false },
			},
			{
				mxId: 1,
			}
		)
			.lean()
			.exec();
		alert(`...finished!`);

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		// No rollback possible, since we don't know which mxIds where set before

		// ////////////////////////////////////////////////////

	},
};
