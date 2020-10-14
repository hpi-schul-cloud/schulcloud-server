const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

require('../src/services/user/model');
// The third parameter is the actually relevent one for what collection to write to.
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
				userDeleted: true,
				deletionDate: new Date(),
			}
		)
			.lean()
			.exec();

		// after one week
		await User.collection.createIndex({ modified: 1 }, { expireAfterSeconds: 604800 });
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
			{
				userDeleted: false,
				deletionDate: null,
			}
		)
			.lean()
			.exec();
		await User.collection.dropIndex({ modified: -1 }, { expireAfterSeconds: -1 });
		await close();
	},
};
