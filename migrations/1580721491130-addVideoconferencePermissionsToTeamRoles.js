const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');
const { PERMISSIONS } = require('../src/services/videoconference/logic/constants');

const RoleModel = mongoose.model(
	'role3457890456890',
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
		// ////////////////////////////////////////////////////
		await RoleModel.findOneAndUpdate(
			{
				name: 'teammember',
			},
			{
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.JOIN_MEETING],
					},
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teamleader',
			},
			{
				$addToSet: {
					permissions: {
						$each: [PERMISSIONS.START_MEETING],
					},
				},
			}
		).exec();
		// /////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await RoleModel.findOneAndUpdate(
			{
				name: 'teammember',
			},
			{
				$pull: {
					permissions: { $in: [PERMISSIONS.JOIN_MEETING] },
				},
			}
		).exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teamleader',
			},
			{
				$pull: {
					permissions: { $in: [PERMISSIONS.START_MEETING] },
				},
			}
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
