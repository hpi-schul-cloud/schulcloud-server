const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles20231205',
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
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['SYSTEM_CREATE'],
					},
				},
			}
		).exec();
		alert(`Permission SYSTEM_CREATE added to role administrator`);

		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['SYSTEM_EDIT'],
					},
				},
			}
		).exec();
		alert(`Permission SYSTEM_EDIT added to role administrator`);

		await close();
	},

	down: async function down() {
		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['SYSTEM_CREATE'],
					},
				},
			}
		).exec();
		alert(`Permission SYSTEM_CREATE removed from role administrator`);

		await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['SYSTEM_EDIT'],
					},
				},
			}
		).exec();
		alert(`Permission SYSTEM_EDIT removed from role administrator`);

		await close();
	},
};
