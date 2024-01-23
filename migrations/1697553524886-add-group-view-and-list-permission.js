const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info } = require('winston');
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'roles2023101716394',
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
			info('Permissions GROUP_VIEW and GROUP_LIST will not be added for this instance.');
			return;
		}

		await connect();

		const groupViewPermission = await Roles.updateOne(
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['GROUP_VIEW'],
					},
				},
			}
		).exec();
		if (groupViewPermission) {
			alert(`Permission GROUP_VIEW added to role user`);
		}

		const groupListPermission = await Roles.updateMany(
			{ name: { $in: ['teacher', 'administrator', 'superhero'] } },
			{
				$addToSet: {
					permissions: {
						$each: ['GROUP_LIST'],
					},
				},
			}
		).exec();
		if (groupListPermission) {
			alert(`Permission GROUP_LIST added to role user and administrator`);
		}

		await close();
	},

	down: async function down() {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Permissions GROUP_VIEW and GROUP_LIST will not be removed for this instance.');
			return;
		}

		await connect();

		const groupViewRollback = await Roles.updateOne(
			{ name: 'user' },
			{
				$pull: {
					permissions: 'GROUP_VIEW',
				},
			}
		).exec();

		if (groupViewRollback) {
			alert(`Rollback: Removed permission GROUP_VIEW from role user`);
		}

		const groupListRollback = await Roles.updateMany(
			{ name: { $in: ['teacher', 'administrator', 'superhero'] } },
			{
				$pull: {
					permissions: 'GROUP_LIST',
				},
			}
		).exec();

		if (groupListRollback) {
			alert(`Rollback: Removed permission GROUP_LIST from roles teacher and administrator`);
		}

		await close();
	},
};
