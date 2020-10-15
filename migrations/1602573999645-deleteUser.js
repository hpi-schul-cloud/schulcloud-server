const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');
require('../src/services/user/model');

const User = mongoose.model(
	'userDeletion',
	new mongoose.Schema(
		{
			firstName: { type: String, required: true },
			lastName: { type: String, required: true },
		},
		{
			timestamps: true,
		}
	),
	'user'
);

module.exports = {
	up: async function up() {
		await connect();
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await User.findOneAndUpdate(
			{
				firstName: 'Marla',
				lastName: 'Mathe',
			},
			{
				createdAt: {
					default: new Date(),
					// after one week
					expireAfterSeconds: 604800,
				},
			}
		)
			.lean()
			.exec();
		await close();
	},

	down: async function down() {
		await connect();
		// Implement the necessary steps to roll back the migration here.
		await User.findOneAndUpdate(
			{
				firstName: 'Marla',
				lastName: 'Mathe',
			},
			{}
		)
			.lean()
			.exec();
		await User.collection.dropIndex('createdAt')
		await close();
	},
};
