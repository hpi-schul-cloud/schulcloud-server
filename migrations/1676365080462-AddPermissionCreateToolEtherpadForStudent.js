const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Roles = mongoose.model(
	'role_202304011544',
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
		await connect();

		await Roles.updateOne(
			{ name: 'student' },
			{
				$addToSet: {
					permissions: {
						$each: ['TOOL_CREATE_ETHERPAD'],
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
						$in: ['TOOL_CREATE_ETHERPAD'],
					},
				},
			}
		).exec();

		await close();
	},
};