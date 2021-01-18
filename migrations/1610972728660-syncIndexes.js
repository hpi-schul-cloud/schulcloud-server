const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const { TeamModel } = require('../src/services/teams/model');
const LessonModel = require('../src/services/lesson/model');
const RoleModel = require('../src/services/role/model');
const { courseGroupModel } = require('../src/services/user-group/model');
const { schoolModel } = require('../src/services/school/model');
const { homeworkModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

module.exports = {
	up: async function up() {
		logger.info('Sync indexes...');
		await connect();

		logger.info('Updating team indexes...');
		await TeamModel.syncIndexes();
		logger.info('Updating lesson indexes...');
		await LessonModel.syncIndexes();
		logger.info('Updating role indexes...');
		await RoleModel.syncIndexes();
		logger.info('Updating courseGroup indexes...');
		await courseGroupModel.syncIndexes();
		logger.info('Updating school indexes...');
		await schoolModel.syncIndexes();
		logger.info('Updating homework indexes...');
		await homeworkModel.syncIndexes();
		logger.info('Updating news indexes...');
		await newsModel.syncIndexes();

		logger.info('Done.');
		await close();
	},

	down: async function down() {
		logger.info('Sync indexes...');
		await connect();

		logger.info('Updating team indexes...');
		await TeamModel.syncIndexes();
		logger.info('Updating lesson indexes...');
		await LessonModel.syncIndexes();
		logger.info('Updating role indexes...');
		await RoleModel.syncIndexes();
		logger.info('Updating courseGroup indexes...');
		await courseGroupModel.syncIndexes();
		logger.info('Updating school indexes...');
		await schoolModel.syncIndexes();
		logger.info('Updating homework indexes...');
		await homeworkModel.syncIndexes();
		logger.info('Updating news indexes...');
		await newsModel.syncIndexes();

		logger.info('Done.');
		await close();
	},
};
