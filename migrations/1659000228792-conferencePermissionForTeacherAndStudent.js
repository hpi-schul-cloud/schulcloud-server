const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'roles280722',
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
		await connect();

		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['START_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permission START_MEETING added to role teacher`);
		await Roles.updateOne(
			{ name: 'student' },
			{
				$addToSet: {
					permissions: {
						$each: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permission JOIN_MEETING added to role student`);
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['START_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permisson START_MEETING removed from role teacher`);
		await Roles.updateOne(
			{ name: 'student' },
			{
				$pull: {
					permissions: {
						$in: ['JOIN_MEETING'],
					},
				},
			}
		).exec();
		alert(`Permission JOIN_MEETING removed from role student`);
		await close();
	},
};
