const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const { PERMISSIONS } = require('../src/services/videoconference/logic/constants');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const RoleModel = mongoose.model(
	'role',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
		},
		{
			timestamps: true,
		}
	)
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
				name: 'courseStudent',
			},
			{
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.JOIN_MEETING],
					},
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'courseTeacher',
			},
			{
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.START_MEETING],
					},
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'courseSubstitutionTeacher',
			},
			{
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.START_MEETING],
					},
				},
			}
		).exec();
		// /////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await RoleModel.findOneAndUpdate(
			{
				name: 'courseStudent',
			},
			{
				$pull: {
					permissions: { $in: [PERMISSIONS.JOIN_MEETING] },
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'courseTeacher',
			},
			{
				$pull: {
					permissions: { $in: [PERMISSIONS.START_MEETING] },
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'courseSubstitutionTeacher',
			},
			{
				$pull: {
					permissions: { $in: [PERMISSIONS.START_MEETING] },
				},
			}
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
