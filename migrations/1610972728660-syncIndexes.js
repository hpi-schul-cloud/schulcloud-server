const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const { teamsModel } = require('../src/services/teams/model');
const { LessonModel } = require('../src/services/lesson/model');
const RoleModel = require('../src/services/role/model');
const { courseGroupModel, classModel, courseModel } = require('../src/services/user-group/model');
const { schoolModel } = require('../src/services/school/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');
const { FileModel } = require('../src/services/fileStorage/model');
const { userModel, registrationPinModel } = require('../src/services/user/model/index');
const VideoConferenceModel = require('../src/services/videoconference/model');

module.exports = {
	up: async function up() {
		logger.info('Sync indicies...');
		await connect();

		logger.info('Updating team indicies...');
		await teamsModel.syncIndexes();
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
		logger.info('Updating user indicies...');
		await userModel.syncIndexes();
		logger.info('Updating videoConference indicies...');
		await VideoConferenceModel.syncIndexes();
		logger.info('Updating class indicies...');
		await classModel.syncIndexes();
		logger.info('Updating registrationPin indicies...');
		await registrationPinModel.syncIndexes();
		logger.info('Updating course indicies...');
		await courseModel.syncIndexes();

		logger.info('Done.');
		await close();
	},

	down: async function down() {
		logger.info('Sync indexes...');
		await connect();

		logger.info('Updating team indicies...');
		await teamsModel.syncIndexes();
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
		logger.info('Updating user indicies...');
		await userModel.syncIndexes();
		logger.info('Updating videoConference indicies...');
		await VideoConferenceModel.syncIndexes();
		logger.info('Updating registrationPin indicies...');
		await registrationPinModel.syncIndexes();
		logger.info('Updating course indicies...');
		await courseModel.syncIndexes();

		logger.info('Done.');
		await close();
	},
};
