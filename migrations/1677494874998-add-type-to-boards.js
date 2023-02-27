const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const splitToChunks = (array, chunkSize) => {
	const result = [];
	// eslint-disable-next-line no-plusplus
	for (let i = chunkSize; i > 0; i--) {
		const part = array.splice(0, Math.ceil(array.length / i));
		if (part.length > 0) {
			result.push(part);
		}
	}
	return result;
};

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Board = mongoose.model(
	'addToBoards270223',
	new mongoose.Schema({
		boardType: { type: String },
	}),
	'board'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// - Only use models declared in the migration.
		// - Make sure your migration is idempotent. It is not guaranteed to run only once!
		// - Avoid any unnecessary references, including environment variables. If you have to run the migration on a single instance, use SC_THEME.

		const data = await Board.find({}).select({ _id: 1 }).lean().exec();
		const boardIds = data.map((b) => b._id);
		const chunks = splitToChunks(boardIds, 100);
		const promises = chunks.map((chunkOfBoardIds) =>
			Board.updateMany({ _id: { $in: chunkOfBoardIds } }, { boardType: 'singlecolumnboard' })
		);
		await Promise.all(promises);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		const data = await Board.find({}).select({ _id: 1 }).lean().exec();
		const boardIds = data.map((b) => b._id);
		const chunks = splitToChunks(boardIds, 100);
		const promises = chunks.map((chunkOfBoardIds) =>
			Board.updateMany({ _id: { $in: chunkOfBoardIds } }, { $unset: { boardType: '' } })
		);
		await Promise.all(promises);
		// ////////////////////////////////////////////////////
		await close();
	},
};
