const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'role_211020221500',
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
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['TOOL_ADMIN'],
					},
				},
			}
		).exec();

		await close();
	},

	down: async function down() {
		await connect();

		await Roles.updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['TOOL_ADMIN'],
					},
				},
			}
		).exec();

		await close();
	},
};
