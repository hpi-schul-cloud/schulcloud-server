const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const ExternalTools = mongoose.model(
	'external-tools1703072644729',
	new mongoose.Schema(
		{
			parameters: [
				{
					isProtected: { type: Boolean, required: true },
				},
			],
		},
		{
			timestamps: true,
		}
	),
	'external-tools'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		await ExternalTools.updateMany(
			{ parameters: { $exists: true } },
			{
				$set: {
					'parameters.$[].isProtected': false,
				},
			}
		)
			.lean()
			.exec();

		await close();
	},

	down: async function down() {
		await connect();

		await ExternalTools.updateMany({ parameters: { $exists: true } }, { $unset: { 'parameters.$[].isProtected': '' } })
			.lean()
			.exec();

		await close();
	},
};
