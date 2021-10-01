const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Course = mongoose.model(
	'course150921',
	new mongoose.Schema(
		{
			color: { type: String },
		},
		{
			timestamps: true,
		}
	),
	'courses'
);

const Team = mongoose.model(
	'teams150921',
	new mongoose.Schema(
		{
			color: { type: String },
		},
		{
			timestamps: true,
		}
	),
	'teams'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

/* const mapping = [{ old: '#ACACAC', new: '#54616e' }]; */

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		await Course.updateMany({}, [
			{
				$set: {
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$color', '#ACACAC'] }, then: '#54616e' },
								{ case: { $eq: ['$color', '#D4AF37'] }, then: '#827717' },
								{ case: { $eq: ['$color', '#00E5FF'] }, then: '#0091EA' },
								{ case: { $eq: ['$color', '#1DE9B6'] }, then: '#009688' },
								{ case: { $eq: ['$color', '#546E7A'] }, then: '#304FFE' },
								{ case: { $eq: ['$color', '#FFC400'] }, then: '#D50000' },
								{ case: { $eq: ['$color', '#BCAAA4'] }, then: '#795548' },
								{ case: { $eq: ['$color', '#FF4081'] }, then: '#EC407A' },
								{ case: { $eq: ['$color', '#FFEE58'] }, then: '#EF6C00' },
							],
							default: '#54616e',
						},
					},
				},
			},
		])
			.lean()
			.exec();

		await Team.updateMany({}, [
			{
				$set: {
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$color', '#ACACAC'] }, then: '#54616e' },
								{ case: { $eq: ['$color', '#D4AF37'] }, then: '#827717' },
								{ case: { $eq: ['$color', '#00E5FF'] }, then: '#0091EA' },
								{ case: { $eq: ['$color', '#1DE9B6'] }, then: '#009688' },
								{ case: { $eq: ['$color', '#546E7A'] }, then: '#304FFE' },
								{ case: { $eq: ['$color', '#FFC400'] }, then: '#D50000' },
								{ case: { $eq: ['$color', '#BCAAA4'] }, then: '#795548' },
								{ case: { $eq: ['$color', '#FF4081'] }, then: '#EC407A' },
								{ case: { $eq: ['$color', '#FFEE58'] }, then: '#EF6C00' },
							],
							default: '#54616e',
						},
					},
				},
			},
		])
			.lean()
			.exec();

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.

		await Course.updateMany({}, [
			{
				$set: {
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$color', '#54616e'] }, then: '#ACACAC' },
								{ case: { $eq: ['$color', '#827717'] }, then: '#D4AF37' },
								{ case: { $eq: ['$color', '#0091EA'] }, then: '#00E5FF' },
								{ case: { $eq: ['$color', '#009688'] }, then: '#1DE9B6' },
								{ case: { $eq: ['$color', '#304FFE'] }, then: '#546E7A' },
								{ case: { $eq: ['$color', '#D50000'] }, then: '#FFC400' },
								{ case: { $eq: ['$color', '#795548'] }, then: '#BCAAA4' },
								{ case: { $eq: ['$color', '#EC407A'] }, then: '#FF4081' },
								{ case: { $eq: ['$color', '#EF6C00'] }, then: '#FFEE58' },
							],
							default: '#ACACAC',
						},
					},
				},
			},
		])
			.lean()
			.exec();

		await Team.updateMany({}, [
			{
				$set: {
					color: {
						$switch: {
							branches: [
								{ case: { $eq: ['$color', '#54616e'] }, then: '#ACACAC' },
								{ case: { $eq: ['$color', '#827717'] }, then: '#D4AF37' },
								{ case: { $eq: ['$color', '#0091EA'] }, then: '#00E5FF' },
								{ case: { $eq: ['$color', '#009688'] }, then: '#1DE9B6' },
								{ case: { $eq: ['$color', '#304FFE'] }, then: '#546E7A' },
								{ case: { $eq: ['$color', '#D50000'] }, then: '#FFC400' },
								{ case: { $eq: ['$color', '#795548'] }, then: '#BCAAA4' },
								{ case: { $eq: ['$color', '#EC407A'] }, then: '#FF4081' },
								{ case: { $eq: ['$color', '#EF6C00'] }, then: '#FFEE58' },
							],
							default: '#ACACAC',
						},
					},
				},
			},
		])
			.lean()
			.exec();

		// ////////////////////////////////////////////////////
		await close();
	},
};
