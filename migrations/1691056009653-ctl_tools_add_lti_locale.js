const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const ExternalTools = mongoose.model(
	'external_tools1691056009653',
	new mongoose.Schema(
		{
			config_type: { type: String, required: true },
			config_launch_presentation_locale: { type: String, required: true },
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

		await ExternalTools.updateMany(
			{ config_type: 'lti11' },
			{
				config_launch_presentation_locale: 'de-DE',
			}
		)
			.lean()
			.exec();

		await close();
	},

	down: async function down() {
		await connect();

		await ExternalTools.updateMany({ config_type: 'lti11' }, { $unset: { config_launch_presentation_locale: '' } })
			.lean()
			.exec();

		await close();
	},
};
