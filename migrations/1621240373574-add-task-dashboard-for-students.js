const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles170521',
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
		// eslint-disable-next-line no-process-env
		if (['n21', 'brb', 'thr'].includes(process.env.SC_THEME)) {
			info('Migration not running on this instance');
			return;
		}
		await connect();
		await Roles.updateOne(
			{ name: 'student' },
			{
				$addToSet: {
					permissions: {
						$each: ['TASK_DASHBOARD_VIEW_V3'],
					},
				},
			}
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'student' },
			{
				$pull: {
					permissions: {
						$in: ['TASK_DASHBOARD_VIEW_V3'],
					},
				},
			}
		).exec();
		await close();
	},
};
