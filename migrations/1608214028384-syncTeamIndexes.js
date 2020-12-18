const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const { teamsSchema } = require('../src/services/teams/model');

const TeamModel = mongoose.model('team1608214028384', teamsSchema, 'teams');

module.exports = {
	up: async function up() {
		logger.info('Execute team...');
		await connect();

		logger.info('Updating team indexes...');
		await TeamModel.syncIndexes();
		logger.info('Done.');

		await close();
	},

	down: async function down() {
		logger.info('Execute team...');
		await connect();

		logger.info('Updating team indexes...');
		await TeamModel.syncIndexes();
		logger.info('Done.');

		await close();
	},
};
