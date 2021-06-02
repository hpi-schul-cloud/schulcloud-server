const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;
// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const NexboardContent = mongoose.model(
	'nexboardcontents20210316',
	new mongoose.Schema(
		{
			contentId: { type: Schema.ObjectId },
			content: {
				url: { type: String },
			},
		},
		{
			timestamps: true,
		}
	),
	'nexboardcontents'
);

const Lesson = mongoose.model(
	'lessons20210316',
	new mongoose.Schema(
		{
			contents: [
				{
					component: { type: String },
					content: {},
				},
			],
		},
		{
			timestamps: true,
		}
	),
	'lessons'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		alert(`reading nexboards`);
		const nexboards = await NexboardContent.find({}).lean().exec();
		alert(`${nexboards.length || 0} nexboards found`);
		alert(`updating lesson contents`);
		const responses = nexboards.map((nexboard) => {
			return Lesson.findOneAndUpdate(
				{
					'contents._id': nexboard.contentId,
				},
				{
					$set: { 'contents.$.content.url': nexboard.content.url },
				}
			)
				.lean()
				.exec();
		});
		await Promise.all(responses);

		alert(`...finished!`);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		alert('Down is not supported.');
	},
};
