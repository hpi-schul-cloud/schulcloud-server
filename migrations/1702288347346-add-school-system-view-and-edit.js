const mongoose = require('mongoose');
const { alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles202312111053',
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

		const adminRole = await Roles.updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['SCHOOL_SYSTEM_EDIT', 'SCHOOL_SYSTEM_VIEW'],
					},
				},
			}
		).exec();

		if (adminRole) {
			alert('Permission SCHOOL_SYSTEM_EDIT and SCHOOL_SYSTEM_VIEW were added to role administrator');
		}

		await close();
	},

	down: async function down() {
		await connect();

		const adminRole = await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_SYSTEM_EDIT', 'SCHOOL_SYSTEM_VIEW'],
					},
				},
			}
		).exec();

		if (adminRole) {
			alert('Rollback: Removed permission SCHOOL_SYSTEM_EDIT and SCHOOL_SYSTEM_VIEW from role administrator');
		}

		await close();
	},
};
