const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { FileSchema } = require('../src/services/fileStorage/model');
const { SubmissionSchema } = require('../src/services/homework/model');

const Files = mongoose.model('files45672425675625', FileSchema, 'files');
const Submissions = mongoose.model('submisions45672425675625', SubmissionSchema, 'submissions');

module.exports = {
	up: async function up() {
		await connect();
		info('Running db.files.createIndex({ owner: 1, parent: 1 });');
		await Files.syncIndexes();
		info('Done.');
		info('Running db.submissions.createIndex({ studentId: 1, teamMembers: 1 });');
		await Submissions.syncIndexes();
		info('Done.');
		await close();
	},

	down: async function down() {
		error(
			`
Rolling back indexes is not possible with mongoose.
Either roll back the schema and run syncIndexes() via a separate migration or manually delete these indexes:
	* db.files.dropIndex({ owner: 1, parent: 1 });
	* db.submissions.dropIndex({ studentId: 1, teamMembers: 1 });
			`
		);
	},
};
