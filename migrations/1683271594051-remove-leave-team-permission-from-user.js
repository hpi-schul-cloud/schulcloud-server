const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'role_202305050910',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }]
		},
		{
			timestamps: true
		}
	),
	'roles'
);

module.exports = {
	up: async function up() {
		await connect();

		await Roles.updateOne(
			{
				name: 'teamadministrator'
			},
			{
				$addToSet: {
					permissions: {
						$each: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await Roles.updateOne(
			{
				name: 'teammember'
			},
			{
				$pull: {
					permissions: {
						$in: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await Roles.updateOne(
			{
				name: 'teamexpert'
			},
			{
				$pull: {
					permissions: {
						$in: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateOne(
			{
				name: 'teamadministrator'
			},
			{
				$pull: {
					permissions: {
						$in: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await Roles.updateOne(
			{
				name: 'teammember'
			},
			{
				$addToSet: {
					permissions: {
						$each: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await Roles.updateOne(
			{
				name: 'teamexpert'
			},
			{
				$addToSet: {
					permissions: {
						$each: ['LEAVE_TEAM']
					}
				},
			}
		).exec();
		await close();
	},
};
