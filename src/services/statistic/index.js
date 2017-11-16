'use strict';

const service = require('feathers-mongoose');
const hooks = require('./hooks/index');
const schoolModel = require('../school/model');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const homeworkModel = require('../homework/model');
const lessonModel = require('../lesson/model');
const groupModel = require('../user-group/model');
const fileModel = require('../fileStorage/model');

class StatisticsService {
	find({query, payload}) {
		const userPromise = userModel.count().exec();
		const schoolPromise = schoolModel.count().exec();
		const accountPromise = accountModel.count().exec();
		const homeworkPromise = homeworkModel.homeworkModel.count().exec();
		const submissionPromise = homeworkModel.submissionModel.count().exec();
		const commentPromise = homeworkModel.commentModel.count().exec();
		const lessonPromise = lessonModel.count().exec();
		const classPromise = groupModel.classModel.count().exec();
		const coursePromise = groupModel.courseModel.count().exec();
		const teacherPromise = userModel.count({roles: '0000d186816abba584714c98'}).exec();
		const studentPromise = userModel.count({roles: '0000d186816abba584714c99'}).exec();
		const filePromise = fileModel.fileModel.count().exec();
		const directoryPromise = fileModel.directoryModel.count().exec();

		return Promise.all([userPromise, schoolPromise, accountPromise, homeworkPromise, submissionPromise, commentPromise, lessonPromise, classPromise, coursePromise, teacherPromise, studentPromise, filePromise, directoryPromise])
			.then(res => {
				res = res.map((result, i) => {
					switch (i) {
						case 0:
							return {users: result};
						case 1:
							return {schools: result};
						case 2:
							return {accounts: result};
						case 3:
							return {homework: result};
						case 4:
							return {submissions: result};
						case 5:
							return {comments: result};
						case 6:
							return {lessons: result};
						case 7:
							return {classes: result};
						case 8:
							return {courses: result};
						case 9:
							return {teachers: result};
						case 10:
							return {students: result};
						case 11:
							return {files: result};
						case 12:
							return {directories: result};
						default:
							return {result};
					}
				});
				return Object.assign(...res);
			});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/statistics', new StatisticsService());

	// Get our initialize service to that we can bind hooks
	const statisticsService = app.service('/statistics');

	// Set up our before hooks
	statisticsService.before(hooks.before);

	// Set up our after hooks
	statisticsService.after(hooks.after);
};
