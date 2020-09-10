const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevant one for what collection to write to.
const RoleModel = mongoose.model(
	'fixDemoModel',
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
				name: 'demo',
			},
			{
				$pull: { permissions: { $in: ['USERGROUP_VIEW'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$addToSet: { permissions: { $each: ['CLASS_VIEW', 'COURSE_VIEW'] } },
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
				name: 'demo',
			},
			{
				$pull: { permissions: { $in: ['CLASS_VIEW', 'COURSE_VIEW'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$addToSet: { permissions: { $each: ['USERGROUP_VIEW'] } },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
