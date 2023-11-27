const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'roles1605231004',
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
			info('Migration does not add the USER_LOGIN_MIGRATION_ADMIN permission for this instance.');
			return;
		}

		await connect();

		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_LOGIN_MIGRATION_ADMIN'],
					},
				},
			}
		).exec();
		await close();
	},
	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not add the USER_LOGIN_MIGRATION_ADMIN permission for this instance.');
			return;
		}

		await connect();

		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['USER_LOGIN_MIGRATION_ADMIN'],
					},
				},
			}
		).exec();

		await close();
	},
};
