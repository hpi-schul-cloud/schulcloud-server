const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const { TeamModel } = require('../src/services/teams/model');
const LessonModel = require('../src/services/lesson/model');
const RoleModel = require('../src/services/role/model');
const { courseGroupModel } = require('../src/services/user-group/model');
const { schoolModel } = require('../src/services/school/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');
const { FileModel } = require('../src/services/fileStorage/model');

module.exports = {
	up: async function up() {
		logger.info('Sync indicies...');
		await connect();

		logger.info('Updating team indicies...');
		await TeamModel.syncIndexes();
		logger.info('Updating lesson indicies...');
		await LessonModel.syncIndexes();
		logger.info('Updating role indicies...');
		await RoleModel.syncIndexes();
		logger.info('Updating courseGroup indicies...');
		await courseGroupModel.syncIndexes();
		logger.info('Updating school indicies...');
		await schoolModel.syncIndexes();
		logger.info('Updating homework indicies...');
		await homeworkModel.syncIndexes();
		logger.info('Updating news indicies...');
		await newsModel.syncIndexes();
		logger.info('Updating submissions indicies...');
		await submissionModel.syncIndexes();
		logger.info('Updating files indicies...');
		await FileModel.syncIndexes();

		logger.info('Done.');
		await close();
	},

	down: async function down() {
		logger.info('Sync indexes...');
		await connect();

		logger.info('Updating team indicies...');
		await TeamModel.syncIndexes();
		logger.info('Updating lesson indicies...');
		await LessonModel.syncIndexes();
		logger.info('Updating role indicies...');
		await RoleModel.syncIndexes();
		logger.info('Updating courseGroup indicies...');
		await courseGroupModel.syncIndexes();
		logger.info('Updating school indicies...');
		await schoolModel.syncIndexes();
		logger.info('Updating homework indicies...');
		await homeworkModel.syncIndexes();
		logger.info('Updating news indicies...');
		await newsModel.syncIndexes();
		logger.info('Updating submissions indicies...');
		await submissionModel.syncIndexes();
		logger.info('Updating files indicies...');
		await FileModel.syncIndexes();

		logger.info('Done.');
		await close();
	},
};
