const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
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
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: [
							'DATASOURCES_EDIT',
							'DATASOURCES_VIEW',
							'DATASOURCES_CREATE',
							'DATASOURCES_DELETE',
							'DATASOURCES_RUN',
							'DATASOURCES_RUN_VIEW',
						],
					},
				},
			}
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: [
							'DATASOURCES_EDIT',
							'DATASOURCES_VIEW',
							'DATASOURCES_CREATE',
							'DATASOURCES_DELETE',
							'DATASOURCES_RUN',
							'DATASOURCES_RUN_VIEW',
						],
					},
				},
			}
		).exec();
		await close();
	},
};
