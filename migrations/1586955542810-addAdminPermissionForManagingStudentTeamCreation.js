const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const roleSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		permissions: [{ type: String }],
	},
	{
		timestamps: true,
	}
);

const Role = mongoose.model('role3244382362348795', roleSchema, 'roles');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		await Role.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$addToSet: {
					permissions: 'SCHOOL_STUDENT_TEAM_MANAGE',
				},
			}
		).exec();
		// /////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		await Role.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: {
					permissions: 'SCHOOL_STUDENT_TEAM_MANAGE',
				},
			}
		).exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
