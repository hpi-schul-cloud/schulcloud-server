/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const fs = require('fs').promises;
const appPromise = require('../src/app');
const { schoolModel } = require('../src/services/school/model');
const { FileModel } = require('../src/services/fileStorage/model');
const { userModel } = require('../src/services/user/model');
const { teamsModel } = require('../src/services/teams/model');
const accountModel = require('../src/services/account/model');
const { courseModel, courseGroupModel, classModel } = require('../src/services/user-group/model');
const ltiToolModel = require('../src/services/ltiTool/model');
const { LessonModel } = require('../src/services/lesson/model');
const passwordRecoveryModel = require('../src/services/passwordRecovery/model');
const {
	userModel: rocketChatUserModel,
	channelModel: rocketChatChannelModel,
} = require('../src/services/rocketChat/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

async function importFiles(type, files) {
	const totalLength = files.length;
	let i = 1;
	for (const file of files) {
		console.log('importing ' + type + ' ' +  + i++ + ' of ' + totalLength)
		await FileModel.create(file);
	}
}

appPromise
	.then(async () => {
		// variable importDirectory needs to be created beforehand with schoolExport.js
		const importDirectory = process.argv[2]
		const fullJson = JSON.parse(await fs.readFile(importDirectory + "/main.json", {encoding: 'utf-8'}));

		await schoolModel.create(fullJson.school);

		for (const course of fullJson.courses) {
			await courseModel.create(course);
		}

		for (const user of fullJson.users) {
			await userModel.create(user);
		}

		for (const acc of fullJson.accounts) {
			await accountModel.create(acc);
		}

		for (const team of fullJson.teams) {
			await teamsModel.create(team);
		}

		for (const group of fullJson.courseGroups) {
			await courseGroupModel.create(group);
		}

		for (const tool of fullJson.ltiTools) {
			await ltiToolModel.create(tool);
		}

		for (const lesson of fullJson.lessons) {
			await LessonModel.create(lesson);
		}

		for (const recovery of fullJson.passwordRecoveries) {
			await passwordRecoveryModel.create(recovery);
		}

		for (const chatUser of fullJson.rocketChatUsers) {
			await rocketChatUserModel.create(chatUser);
		}

		for (const chatChannel of fullJson.rocketChatChannels) {
			await rocketChatChannelModel.create(chatChannel);
		}

		for (const oneClass of fullJson.classes) {
			await classModel.create(oneClass);
		}

		for (const homework of fullJson.homework) {
			await homeworkModel.create(homework);
		}

		for (const news of fullJson.news) {
			await newsModel.create(news);
		}

		for (const sub of fullJson.submissions) {
			await submissionModel.create(sub);
		}

		console.log('importing files')

		await importFiles('users', JSON.parse(await fs.readFile(importDirectory + '/userFiles.json', {encoding: 'utf-8'})));
		await importFiles('teams', JSON.parse(await fs.readFile(importDirectory + '/teamFiles.json', {encoding: 'utf-8'})));
		await importFiles('courses', JSON.parse(await fs.readFile(importDirectory + '/courseFiles.json', {encoding: 'utf-8'})));

		console.log('done');

		return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
