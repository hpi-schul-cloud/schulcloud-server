'use strict';

const service = require('feathers-mongoose');
const hooks = require('./hooks/index');
const hooks2 = require('./hooks/index2');
const schoolModel = require('../school/model');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const homeworkModel = require('../homework/model');
const lessonModel = require('../lesson/model');
const groupModel = require('../user-group/model');
const fileModel = require('../fileStorage/model');
const statisticModel = require('./model');

const fetchStatistics = () => {
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
};

class StatisticsFetchService {
	find({query, payload}) {
		return fetchStatistics()
			.then(statistics => {
				statisticModel.create(statistics);

				return statistics;
			})
	}
}

class StatisticsRecentService {
	find({query, payload}) {
		return fetchStatistics()
			.then(statistics => {
				return statistics;
			})
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: statisticModel,
		paginate: {
			default: 100,
			max: 50000
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/statistics/recent', new StatisticsRecentService());
	app.use('/statistics/fetch', new StatisticsFetchService());
	app.use('/statistics', service(options));

	// Get our initialize service to that we can bind hooks
	const statisticsRecentService = app.service('/statistics/recent');
	const statisticsFetchService = app.service('/statistics/fetch');
	const statisticsService = app.service('/statistics');

	// Set up our before hooks
	statisticsRecentService.before(hooks.before);
	statisticsFetchService.before(hooks.before);
	statisticsService.before(hooks.before);

	// Set up our after hooks
	statisticsRecentService.after(hooks.after);
	statisticsFetchService.after(hooks.after);
	statisticsService.after(hooks.after);
};
