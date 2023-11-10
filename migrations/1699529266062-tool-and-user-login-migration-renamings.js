const mongoose = require('mongoose');
const { info, error } = require('../src/logger');
const { connect, close } = require('../src/utils/database');

async function renameAndDeleteCollection(oldName, newName) {
	try {
		const { connection } = mongoose;

		// Check whether the new collection already exists
		const newCollectionExists = await connection.db.listCollections({ name: newName }).hasNext();

		if (newCollectionExists) {
			// If the new collection already exists, delete it
			await connection.collection(newName).drop();
			info(`Dropped existing collection ${newName}`);
		}

		// Rename the old collection to the new collection
		await connection.collection(oldName).rename(newName);
		info(`Renamed collection ${oldName} to ${newName}`);
	} catch (err) {
		error(`Error renaming and deleting collection ${oldName} to ${newName}: ${err.message}`);
		throw err;
	}
}

module.exports = {
	up: async function up() {
		await connect();

		await renameAndDeleteCollection('user_login_migrations', 'user-login-migrations');
		await renameAndDeleteCollection('external_tools', 'external-tools');
		await renameAndDeleteCollection('context_external_tools', 'context-external-tools');
		await renameAndDeleteCollection('school_external_tools', 'school-external-tools');

		await close();
	},

	down: async function down() {
		await connect();

		await renameAndDeleteCollection('user-login-migrations', 'user_login_migrations');
		await renameAndDeleteCollection('external-tools', 'external_tools');
		await renameAndDeleteCollection('context-external-tools', 'context_external_tools');
		await renameAndDeleteCollection('school-external-tools', 'school_external_tools');

		await close();
	},
};
