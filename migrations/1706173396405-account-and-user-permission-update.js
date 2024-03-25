const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles20240125',
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
						$each: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		).exec();

		if (adminRole) {
			alert('Permission USER_CHANGE_OWN_NAME was added to role administrator');
		}

		const teacherRole = await Roles.updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		).exec();

		if (teacherRole) {
			alert('Permission USER_CHANGE_OWN_NAME was added to role teacher');
		}

		const superheroRole = await Roles.updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CHANGE_OWN_NAME', 'ACCOUNT_VIEW', 'ACCOUNT_DELETE'],
					},
				},
			}
		).exec();

		if (superheroRole) {
			alert('Permissions USER_CHANGE_OWN_NAME, ACCOUNT_VIEW and ACCOUNT_DELETE were added to role superhero');
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
						$in: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		).exec();

		if (adminRole) {
			alert('Rollback: Removed permission USER_CHANGE_OWN_NAME from role administrator');
		}

		const teacherRole = await Roles.updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		).exec();

		if (teacherRole) {
			alert('Rollback: Removed permission USER_CHANGE_OWN_NAME from role teacher');
		}

		const superheroRole = await Roles.updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['USER_CHANGE_OWN_NAME', 'ACCOUNT_VIEW', 'ACCOUNT_DELETE'],
					},
				},
			}
		).exec();

		if (superheroRole) {
			alert('Rollback: Removed permissions USER_CHANGE_OWN_NAME, ACCOUNT_VIEW and ACCOUNT_DELETE from role superhero');
		}

		await close();
	},
};
