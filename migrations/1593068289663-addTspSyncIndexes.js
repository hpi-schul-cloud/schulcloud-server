const mongoose = require('mongoose');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const { userSchema } = require('../src/services/user/model/user.schema');
const { schoolSchema } = require('../src/services/school/model');

const User = mongoose.model('user735498457893247852', userSchema, 'users');
const School = mongoose.model('school735498457893247852', schoolSchema, 'schools');

module.exports = {
	up: async function up() {
		if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
			logger.info('TSP features are enabled');
			await connect();

			logger.info('Updating user indexes...');
			await User.syncIndexes();
			logger.info('Done.');

			logger.info('Updating school indexes...');
			await School.syncIndexes();
			logger.info('Done.');

			await close();
		}
	},

	down: async function down() {
		if (Configuration.get('FEATURE_TSP_ENABLED') === true) {
			logger.info('TSP features are enabled');
			await connect();

			logger.info('Updating user indexes...');
			await User.syncIndexes();
			logger.info('Done.');

			logger.info('Updating school indexes...');
			await School.syncIndexes();
			logger.info('Done.');

			await close();
		}
	},
};
