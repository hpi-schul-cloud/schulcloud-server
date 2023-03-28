const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const School = mongoose.model(
	'school202303170948',
	new mongoose.Schema(
		{
			features: [{ type: String }],
		},
		{
			timestamps: true,
		}
	),
	'schools'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// - Only use models declared in the migration.
		// - Make sure your migration is idempotent. It is not guaranteed to run only once!
		// - Avoid any unnecessary references, including environment variables. If you have to run the migration on a single instance, use SC_THEME.

		await School.updateMany(
			{},
			{
				$addToSet: {
					features: {
						$each: ['oauthProvisioningEnabled'],
					},
				},
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
		await School.updateMany(
			{},
			{
				$pull: {
					features: {
						$in: ['oauthProvisioningEnabled'],
					},
				},
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
