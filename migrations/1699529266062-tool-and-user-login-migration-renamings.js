const mongoose = require('mongoose');
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

async function renameCollection(oldName, newName) {
	try {
		await mongoose.connection.collection(oldName).rename(newName);
		info(`Renamed collection ${oldName} to ${newName}`);
	} catch (err) {
		error(`Error renaming collection ${oldName} to ${newName}: ${err.message}`);
		throw err;
	}
}

module.exports = {
	up: async function up() {
		await connect();

		await renameCollection('user_login_migrations', 'user-login-migrations');

		await renameCollection('external_tools', 'external-tools');

		await renameCollection('context_external_tools', 'context-external-tools');

		await renameCollection('school_external_tools', 'school-external-tools');

		await close();
	},

	down: async function down() {
		await connect();

		await renameCollection('user-login-migrations', 'user_login_migrations');

		await renameCollection('external-tools', 'external_tools');

		await renameCollection('context-external-tools', 'context_external_tools');

		await renameCollection('school-external-tools', 'school_external_tools');

		await close();
	},
};
