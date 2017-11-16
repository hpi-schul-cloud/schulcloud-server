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

		let promises = [
			{
				name: 'users',
				promise: userModel.count().exec()
			},
			{
				name: 'schools',
				promise: schoolModel.count().exec()
			},
			{
				name: 'accounts',
				promise: accountModel.count().exec()
			},
			{
				name: 'homework',
				promise: homeworkModel.homeworkModel.count().exec()
			},
			{
				name: 'submissions',
				promise: homeworkModel.submissionModel.count().exec()
			},
			{
				name: 'comments',
				promise: homeworkModel.commentModel.count().exec()
			},
			{
				name: 'lessons',
				promise: lessonModel.count().exec()
			},
			{
				name: 'classes',
				promise: groupModel.classModel.count().exec()
			},
			{
				name: 'courses',
				promise: groupModel.courseModel.count().exec()
			},
			{
				name: 'teachers',
				promise: userModel.count({roles: '0000d186816abba584714c98'}).exec()
			},
			{
				name: 'students',
				promise: userModel.count({roles: '0000d186816abba584714c99'}).exec()
			},
			{
				name: 'files',
				promise: fileModel.fileModel.count().exec()
			},
			{
				name: 'directories',
				promise: fileModel.directoryModel.count().exec()
			},
		];

		let statistics = {};


		return Promise.all(promises.map(p => {
			return p.promise.then(res => {
				statistics[p.name] = res;
				return res;
			});
		})).then(_ => statistics);
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
