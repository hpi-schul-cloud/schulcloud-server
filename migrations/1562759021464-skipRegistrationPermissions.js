const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model(
	'role',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
		},
		{
			timestamps: true,
		}
	)
);

module.exports = {
	up: async function up() {
		await connect();
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$push: { permissions: 'STUDENT_SKIP_REGISTRATION' },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$push: { permissions: { $each: ['STUDENT_SKIP_REGISTRATION', 'TEACHER_SKIP_REGISTRATION'] } },
			}
		)
			.lean()
			.exec();
		await close();
	},

	down: async function down() {
		await connect();
		// Implement the necessary steps to roll back the migration here.
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$pull: { permissions: 'STUDENT_SKIP_REGISTRATION' },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: { permissions: { $in: ['STUDENT_SKIP_REGISTRATION', 'TEACHER_SKIP_REGISTRATION'] } },
			}
		)
			.lean()
			.exec();
		await close();
	},
};
