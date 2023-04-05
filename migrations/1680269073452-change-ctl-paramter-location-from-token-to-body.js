const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const ExternalTool = mongoose.model(
	'external_tools202303311526',
	new mongoose.Schema(
		{
			parameters: [
				new Schema(
					{
						name: { type: String, required: true },
						displayName: { type: String, required: true },
						location: { type: String, required: true },
					},
					{ _id: false, timestamps: false }
				),
			],
		},
		{
			timestamps: true,
		}
	),
	'external_tools'
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

		await ExternalTool.updateMany(
			{
				'parameters.location': 'token',
			},
			{
				'parameters.$[element].location': 'body',
			},
			{ arrayFilters: [{ 'element.location': 'token' }] }
		)
			.lean()
			.exec();

		await ExternalTool.updateMany({}, [
			{
				$set: {
					parameters: {
						$map: {
							input: '$parameters',
							in: { $mergeObjects: ['$$this', { displayName: '$$this.name' }] },
						},
					},
				},
			},
		])
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await ExternalTool.updateMany(
			{
				'parameters.location': 'body',
			},
			{
				'parameters.$[element].location': 'token',
			},
			{ arrayFilters: [{ 'element.location': 'body' }] }
		)
			.lean()
			.exec();

		await ExternalTool.updateMany(
			{},
			{
				$unset: { 'parameters.$[].displayName': '' },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
