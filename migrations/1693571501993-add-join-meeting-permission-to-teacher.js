const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'roles0109231450',
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

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not add the JOIN_MEETING permission for this instance.');
			return;
		}

		await connect();

		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permission JOIN_MEETING added to role teacher`);
		await close();
	},

	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not remove the JOIN_MEETING permission for this instance.');
			return;
		}

		await connect();

		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permission JOIN_MEETING removed from role teacher`);
		await close();
	},
};
