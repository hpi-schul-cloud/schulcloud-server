const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model('role', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}));

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			}, {
				$pull: { permissions: { $in: ['USER_VIEW', 'USER_EDIT'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			}, {
				$addToSet: { permissions: { $each: ['STUDENT_EDIT'] } },
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$pull: { permissions: { $in: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT', 'USER_CREATE'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$addToSet: { permissions: { $each: ['STUDENT_LIST', 'TEACHER_LIST'] } },
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			}, {
				$pull: { permissions: { $in: ['USER_CREATE'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			}, {
				$addToSet: {
					permissions: {
						$each: [
							'STUDENT_LIST',
							'TEACHER_CREATE', 'TEACHER_EDIT', 'TEACHER_LIST',
						],
					},
				},
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$addToSet: {
					permissions: {
						$each: [
							'STUDENT_CREATE', 'STUDENT_DELETE', 'STUDENT_LIST',
							'TEACHER_CREATE', 'TEACHER_DELETE', 'TEACHER_EDIT', 'TEACHER_LIST'],
					},
				},
			},
		).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			}, {
				$addToSet: { permissions: { $each: ['USER_VIEW', 'USER_EDIT'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'user',
			}, {
				$pull: { permissions: { $in: ['STUDENT_EDIT'] } },
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$addToSet: { permissions: { $each: ['HOMEWORK_CREATE', 'HOMEWORK_EDIT', 'USER_CREATE'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'teacher',
			}, {
				$pull: { permissions: { $in: ['STUDENT_LIST', 'TEACHER_LIST'] } },
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			}, {
				$addToSet: { permissions: { $each: ['USER_CREATE'] } },
			},
		).lean().exec();
		await RoleModel.findOneAndUpdate(
			{
				name: 'administrator',
			}, {
				$pull: {
					permissions: {
						$in: [
							'STUDENT_LIST',
							'TEACHER_CREATE', 'TEACHER_EDIT', 'TEACHER_LIST',
						],
					},
				},
			},
		).lean().exec();



		await RoleModel.findOneAndUpdate(
			{
				name: 'superhero',
			}, {
				$pull: {
					permissions: {
						$in: [
							'STUDENT_CREATE', 'STUDENT_DELETE', 'STUDENT_LIST',
							'TEACHER_CREATE', 'TEACHER_DELETE', 'TEACHER_EDIT', 'TEACHER_LIST',
						],
					},
				},
			},
		).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
