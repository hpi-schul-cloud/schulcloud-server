const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const defaultFeatures = [];
const USER_FEATURES = {
	EDTR: 'edtr',
};

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const User = mongoose.model(
	'addEDTRFeatureToKlaraFall',
	new mongoose.Schema(
		{
			email: { type: String, required: true, lowercase: true },
			features: {
				type: [String],
				default: defaultFeatures,
				enum: Object.values(USER_FEATURES),
			},
		},
		{
			timestamps: true,
		}
	),
	'users'
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
		await User.update(
			{
				email: 'klara.fall@schul-cloud.org',
			},
			{
				$push: { features: 'edtr' },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await User.update(
			{
				email: 'klara.fall@schul-cloud.org',
			},
			{
				$pull: { features: 'edtr' },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
