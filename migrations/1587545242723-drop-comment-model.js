const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Comment = mongoose.model('migrationComment', new mongoose.Schema({}), 'comments');

const Submission = mongoose.model('migrationSubmission', new mongoose.Schema({}), 'submissions');

module.exports = {
	up: async function up() {
		await connect();

		// Remove references
		// https://team.goodeggs.com/how-to-remove-a-property-from-a-mongoose-js-schema-1947330c6974?gi=a88317281a73
		await Submission.collection.updateMany({}, { $unset: { comments: true } });

		// Remove obsolete collection
		await Comment.collection.drop();
		await close();
	},

	down: async function down() {
		await connect();
		await Comment.createCollection();
		await close();
	},
};
