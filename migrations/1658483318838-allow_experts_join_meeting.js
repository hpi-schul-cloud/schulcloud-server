const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles200722',
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
			info('Migration does not add the JOIN_MEETING permission to role teamexpert for this instance.');
			return;
		}
		await connect();
		await Roles.updateOne(
			{ name: 'teamexpert' },
			{
				$addToSet: {
					permissions: {
						$each: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permisson JOIN_MEETING added to role teamexpert`);
		await close();
	},

	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not remove the JOIN_MEETING permission from role teamexpert for this instance.');
			return;
		}
		await connect();
		await Roles.updateOne(
			{ name: 'teamexpert' },
			{
				$pull: {
					permissions: {
						$in: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permisson JOIN_MEETING removed from role teamexpert`);
		await close();
	},
};
