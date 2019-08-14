const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const User = mongoose.model('user', new mongoose.Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
}, {
	timestamps: true,
}));

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await User.findOneAndUpdate({
			firstName: 'Marla',
			lastName: 'Mathe',
		}, {
			firstName: 'Max',
		}).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await User.findOneAndUpdate({
			firstName: 'Max',
			lastName: 'Mathe',
		}, {
			firstName: 'Marla',
		}).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
