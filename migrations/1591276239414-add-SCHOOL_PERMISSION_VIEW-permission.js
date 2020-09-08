const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model(
	'role20200603',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
		},
		{
			timestamps: true,
		}
	),
	'roles'
);

const permissions = ['SCHOOL_PERMISSION_VIEW', 'SCHOOL_PERMISSION_CHANGE'];

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
				name: 'administrator',
			},
			{
				$addToSet: { permissions: { $each: permissions } },
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

		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: { permissions: { $in: permissions } },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
