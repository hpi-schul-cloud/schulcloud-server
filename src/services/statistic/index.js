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
const moment = require('moment');
const _ = require('lodash');

let promises = [
	{
		name: 'users',
		promise: userModel.count().exec(),
		model: userModel.find().exec()
	},
	{
		name: 'schools',
		promise: schoolModel.count().exec(),
		model: schoolModel.find().exec()
	},
	{
		name: 'accounts',
		promise: accountModel.count().exec(),
		model: accountModel.find().exec()
	},
	{
		name: 'homework',
		promise: homeworkModel.homeworkModel.count().exec(),
		model: homeworkModel.homeworkModel.find().exec()
	},
	{
		name: 'submissions',
		promise: homeworkModel.submissionModel.count().exec(),
		model: homeworkModel.submissionModel.find().exec()
	},
	{
		name: 'comments',
		promise: homeworkModel.commentModel.count().exec(),
		model: homeworkModel.commentModel.find().exec()
	},
	{
		name: 'lessons',
		promise: lessonModel.count().exec(),
		model: lessonModel.find().exec()
	},
	{
		name: 'classes',
		promise: groupModel.classModel.count().exec(),
		model: groupModel.classModel.find().exec()
	},
	{
		name: 'courses',
		promise: groupModel.courseModel.count().exec(),
		model: groupModel.courseModel.find().exec()
	},
	{
		name: 'teachers',
		promise: userModel.count({roles: '0000d186816abba584714c98'}).exec(),
		model: userModel.find({roles: '0000d186816abba584714c98'}).exec()
	},
	{
		name: 'students',
		promise: userModel.count({roles: '0000d186816abba584714c99'}).exec(),
		model: userModel.find({roles: '0000d186816abba584714c99'}).exec()
	},
	{
		name: 'files',
		promise: fileModel.fileModel.count().exec(),
		model: fileModel.fileModel.find().exec()
	},
	{
		name: 'directories',
		promise: fileModel.directoryModel.count().exec(),
		model: fileModel.directoryModel.find().exec()
	},
];

const fetchStatistics = () => {

	let statistics = {};

	return Promise.all(promises.map(p => {
		return p.promise.then(res => {
			statistics[p.name] = res;
			return res;
		});
	})).then(_ => statistics);
};

class StatisticsService {
	find({query, payload}) {
		return fetchStatistics()
			.then(statistics => {
				return statistics;
			});
	}

	get(id, params) {
		return _.find(promises, {name: id}).model
			.then(generic => {
				let stats =	generic.map(gen => {
					return moment(gen.createdAt).format('YYYY-MM-DD');
				});

				let counts = {};
				stats.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
				return counts;
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
