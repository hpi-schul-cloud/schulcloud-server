const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles200523',
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

module.exports = {
	up: async function up() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not add the NEXTCLOUD_USER permission for this instance.');
			return;
		}

		await connect();

		await Roles.updateMany(
			{},
			{
				$pull: {
					permissions: {
						$in: ['NEXTCLOUD_USER'],
					},
				},
			}
		).exec();

		await Roles.updateOne(
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['NEXTCLOUD_USER'],
					},
				},
			}
		).exec();
		await close();
	},
	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not add the NEXTCLOUD_USER permission for this instance.');
			return;
		}

		await connect();
		await Roles.updateOne(
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['NEXTCLOUD_USER'],
					},
				},
			}
		).exec();

		await close();
	},
};
