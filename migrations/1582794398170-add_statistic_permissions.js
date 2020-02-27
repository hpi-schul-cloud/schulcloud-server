const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const { PERMISSIONS } = require('../src/services/statistic/logic/constants');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const RoleModel = mongoose.model('1582794398170', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}), 'roles');

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
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			}, {
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.VIEW_MYSCHOOL_STATS],
					},
				},
			},
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.VIEW_MYSCHOOL_STATS,
							PERMISSIONS.VIEW_GLOBAL_STATS,
							PERMISSIONS.VIEW_ALLSCHOOL_STATS],
					},
				},
			},
		).exec();
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
			}, {
				$pull: {
					permissions: { $in: [PERMISSIONS.VIEW_MYSCHOOL_STATS] },
				},
			},
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$pull: {
					permissions: {
						$in: [PERMISSIONS.VIEW_MYSCHOOL_STATS,
							PERMISSIONS.VIEW_GLOBAL_STATS,
							PERMISSIONS.VIEW_ALLSCHOOL_STATS],
					},
				},
			},
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
