const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const User = mongoose.model(
	'makeMeUnique',
	new mongoose.Schema(
		{
			firstName: { type: String, required: true },
			lastName: { type: String, required: true },
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
		// - Only use models declared in the migration.
		// - Make sure your migration is idempotent. It is not guaranteed to run only once!
		// - Avoid any unnecessary references, including environment variables. If you have to run the migration on a single instance, use SC_THEME.

		await User.findOneAndUpdate(
			{
				firstName: 'Marla',
				lastName: 'Mathe',
			},
			{
				firstName: 'Max',
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
		await User.findOneAndUpdate(
			{
				firstName: 'Max',
				lastName: 'Mathe',
			},
			{
				firstName: 'Marla',
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
