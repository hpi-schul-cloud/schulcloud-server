const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

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

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		// User
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			},
			{
				$pull: { permissions: { $in: ['USER_VIEW', 'USER_EDIT', 'USERGROUP_VIEW'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			},
			{
				$addToSet: { permissions: { $each: ['STUDENT_EDIT', 'CLASS_VIEW', 'COURSE_VIEW'] } },
			}
		)
			.lean()
			.exec();

		// Teacher
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$pull: {
					permissions: {
						$in: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT', 'USER_CREATE', 'USERGROUP_CREATE', 'USERGROUP_EDIT'],
					},
				},
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$addToSet: {
					permissions: {
						$each: [
							'STUDENT_LIST',
							'TEACHER_LIST',
							'CLASS_CREATE',
							'CLASS_EDIT',
							'CLASS_REMOVE',
							'COURSE_CREATE',
							'COURSE_REMOVE',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// Administrator
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: {
					permissions: {
						$in: ['USER_CREATE', 'USERGROUP_CREATE', 'USERGROUP_EDIT', 'USERGROUP_FULL_ADMIN'],
					},
				},
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$addToSet: {
					permissions: {
						$each: [
							'STUDENT_LIST',
							'TEACHER_CREATE',
							'TEACHER_EDIT',
							'TEACHER_LIST',
							'CLASS_CREATE',
							'CLASS_EDIT',
							'CLASS_REMOVE',
							'CLASS_FULL_ADMIN',
							'COURSE_CREATE',
							'COURSE_EDIT',
							'COURSE_REMOVE',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// Superhero
		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			},
			{
				$addToSet: {
					permissions: {
						$each: [
							'STUDENT_CREATE',
							'STUDENT_DELETE',
							'STUDENT_LIST',
							'TEACHER_CREATE',
							'TEACHER_DELETE',
							'TEACHER_EDIT',
							'TEACHER_LIST',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// demo
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$pull: { permissions: { $in: ['USERGROUP_VIEW'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$addToSet: { permissions: { $each: ['CLASS_VIEW', 'COURSE_VIEW'] } },
			}
		)
			.lean()
			.exec();

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		// User
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			},
			{
				$addToSet: {
					permissions: {
						$each: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT', 'USER_CREATE', 'USERGROUP_CREATE', 'USERGROUP_EDIT'],
					},
				},
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			},
			{
				$pull: { permissions: { $in: ['STUDENT_EDIT', 'CLASS_VIEW', 'COURSE_VIEW'] } },
			}
		)
			.lean()
			.exec();

		// Teacher
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$addToSet: { permissions: { $each: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT', 'USER_CREATE'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			},
			{
				$pull: {
					permissions: {
						$in: [
							'STUDENT_LIST',
							'TEACHER_LIST',
							'CLASS_CREATE',
							'CLASS_EDIT',
							'CLASS_REMOVE',
							'COURSE_CREATE',
							'COURSE_REMOVE',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// Administrator
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CREATE', 'USERGROUP_CREATE', 'USERGROUP_EDIT', 'USERGROUP_FULL_ADMIN'],
					},
				},
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			},
			{
				$pull: {
					permissions: {
						$in: [
							'STUDENT_LIST',
							'TEACHER_CREATE',
							'TEACHER_EDIT',
							'TEACHER_LIST',
							'CLASS_CREATE',
							'CLASS_EDIT',
							'CLASS_REMOVE',
							'CLASS_FULL_ADMIN',
							'COURSE_CREATE',
							'COURSE_EDIT',
							'COURSE_REMOVE',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// Superhero
		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			},
			{
				$pull: {
					permissions: {
						$in: [
							'STUDENT_CREATE',
							'STUDENT_DELETE',
							'STUDENT_LIST',
							'TEACHER_CREATE',
							'TEACHER_DELETE',
							'TEACHER_EDIT',
							'TEACHER_LIST',
						],
					},
				},
			}
		)
			.lean()
			.exec();

		// demo
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$pull: { permissions: { $in: ['CLASS_VIEW', 'COURSE_VIEW'] } },
			}
		)
			.lean()
			.exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'demo',
			},
			{
				$addToSet: { permissions: { $each: ['USERGROUP_VIEW'] } },
			}
		)
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
