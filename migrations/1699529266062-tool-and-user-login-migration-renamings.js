const mongoose = require('mongoose');
const { info, error } = require('../src/logger');
const { connect, close } = require('../src/utils/database');

async function aggregateAndDropCollection(oldName, newName) {
	try {
		const { connection } = mongoose;

		// Aggregation pipeline for copying the documents
		const pipeline = [{ $match: {} }, { $out: newName }];

		// Copy documents from the old collection to the new collection
		await connection.collection(oldName).aggregate(pipeline).toArray();
		info(`Aggregated and copied documents from ${oldName} to ${newName}`);

		// Delete old collection
		await connection.collection(oldName).drop();
		info(`Dropped collection ${oldName}`);
	} catch (err) {
		error(`Error aggregating, copying, and deleting collection ${oldName} to ${newName}: ${err.message}`);
		throw err;
	}
}

module.exports = {
	up: async function up() {
		await connect();

		await aggregateAndDropCollection('user_login_migrations', 'user-login-migrations');
		await aggregateAndDropCollection('external_tools', 'external-tools');
		await aggregateAndDropCollection('context_external_tools', 'context-external-tools');
		await aggregateAndDropCollection('school_external_tools', 'school-external-tools');

		await close();
	},

	down: async function down() {
		await connect();

		await aggregateAndDropCollection('user-login-migrations', 'user_login_migrations');
		await aggregateAndDropCollection('external-tools', 'external_tools');
		await aggregateAndDropCollection('context-external-tools', 'context_external_tools');
		await aggregateAndDropCollection('school-external-tools', 'school_external_tools');

		await close();
	},
};
