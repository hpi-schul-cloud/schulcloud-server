const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const { SC_THEME } = require('../config/globals');
// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const features = mongoose.model(
	'features',
	new mongoose.Schema({
		features: [
			{
				type: String,
				enum: ['rocketChat', 'disableStudentTeamCreation'],
			},
		],
	}),
	'schools'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		if (SC_THEME !== 'n21') {
			info('Migration will be applied to n21 instance only! Ignore...');
			return Promise.resolve();
		}

		await connect();
		// ////////////////////////////////////////////////////
		await features
			.updateMany(
				{
					features: { $ne: 'disableStudentTeamCreation' },
				},
				{
					$push: {
						features: 'disableStudentTeamCreation',
					},
				}
			)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();

		info('Migration has been applied to this instance of n21');
		return Promise.resolve();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		error('can not roll back this migration');
		// ////////////////////////////////////////////////////
		await close();
	},
};
