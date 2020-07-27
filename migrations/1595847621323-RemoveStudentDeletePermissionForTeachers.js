const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model('role20202707', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}), 'roles');

const permission = 'STUDENT_DELETE';

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$pull: { permissions: permission },
			},
		);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$addToSet: { permissions: permission },
			},
		);
		// ////////////////////////////////////////////////////
		await close();
	},
};
