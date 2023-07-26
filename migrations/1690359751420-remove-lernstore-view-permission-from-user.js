const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles1690359751420',
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
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['LERNSTORE_VIEW'],
					},
				},
			}
		).exec();
		alert(`Permission LERNSTORE_VIEW removed from the user role`);

		await close();
	},

	down: async function down() {
		await connect();

		await Roles.updateOne(
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['LERNSTORE_VIEW'],
					},
				},
			}
		).exec();
		alert(`Permission LERNSTORE_VIEW added to the user role`);

		await close();
	},
};
