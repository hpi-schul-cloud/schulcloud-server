const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info } = require('winston');
const { alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles202310261524',
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
			info('Permission GROUP_FULL_ADMIN will not be added for this instance.');
			return;
		}

		await connect();

		const adminAndSuperheroRole = await Roles.updateMany(
			{ name: { $in: ['administrator', 'superhero'] } },
			{
				$addToSet: {
					permissions: {
						$each: ['GROUP_FULL_ADMIN'],
					},
				},
			}
		).exec();

		if (adminAndSuperheroRole) {
			alert('Permission GROUP_FULL_ADMIN added to role superhero and administrator');
		}

		await close();
	},

	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Permission GROUP_FULL_ADMIN will not be removed for this instance.');
			return;
		}

		await connect();

		const adminAndSuperheroRole = await Roles.updateMany(
			{ name: { $in: ['teacher', 'administrator', 'superhero'] } },
			{
				$pull: {
					permissions: 'GROUP_FULL_ADMIN',
				},
			}
		).exec();

		if (adminAndSuperheroRole) {
			alert('Rollback: Removed permission GROUP_FULL_ADMIN from roles superhero and administrator');
		}

		await close();
	},
};
