const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'role_220920221502',
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
						$each: ['OAUTH_CLIENT_EDIT', 'OAUTH_CLIENT_VIEW'],
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
						$in: ['OAUTH_CLIENT_EDIT', 'OAUTH_CLIENT_VIEW'],
					},
				},
			}
		).exec();

		await close();
	},
};
