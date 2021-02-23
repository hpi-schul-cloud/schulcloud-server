const mongoose = require('mongoose');
const logger = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { userSchema } = require('../src/services/user/model/user.schema');

const User = mongoose.model('user735498457893247852', userSchema, 'users');

module.exports = {
	up: async function up() {
		await connect();
		logger.info('Syncing indexes in users collection...');
		await User.syncIndexes();
		logger.info('Done.');
		await close();
	},

	down: async function down() {
		await connect();
		logger.info('Syncing indexes in users collection...');
		await User.syncIndexes();
		logger.info('Done.');
		await close();
	},
};
