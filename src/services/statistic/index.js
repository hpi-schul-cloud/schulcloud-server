const moment = require('moment');
const _ = require('lodash');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks/index');
const swaggerDocs = require('./docs');
const schoolModel = require('../school/model');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const homeworkModel = require('../homework/model');
const lessonModel = require('../lesson/model');
const groupModel = require('../user-group/model');
const { FileModel } = require('../fileStorage/model');

const promises = [
	{
		name: 'users',
		promise: userModel.userModel.countDocuments(),
		model: userModel.userModel.find(),
	},
	{
		name: 'schools',
		promise: schoolModel.schoolModel.countDocuments(),
		model: schoolModel.schoolModel.find(),
	},
	{
		name: 'accounts',
		promise: accountModel.countDocuments(),
		model: accountModel.find(),
	},
	{
		name: 'homework',
		promise: homeworkModel.homeworkModel.countDocuments(),
		model: homeworkModel.homeworkModel.find(),
	},
	{
		name: 'submissions',
		promise: homeworkModel.submissionModel.countDocuments(),
		model: homeworkModel.submissionModel.find(),
	},
	{
		name: 'lessons',
		promise: lessonModel.countDocuments(),
		model: lessonModel.find(),
	},
	{
		name: 'classes',
		promise: groupModel.classModel.countDocuments(),
		model: groupModel.classModel.find(),
	},
	{
		name: 'courses',
		promise: groupModel.courseModel.countDocuments(),
		model: groupModel.courseModel.find(),
	},
	{
		name: 'teachers',
		promise: userModel.userModel.countDocuments({ roles: '0000d186816abba584714c98' }),
		model: userModel.userModel.find({ roles: '0000d186816abba584714c98' }),
	},
	{
		name: 'students',
		promise: userModel.userModel.countDocuments({ roles: '0000d186816abba584714c99' }),
		model: userModel.userModel.find({ roles: '0000d186816abba584714c99' }),
	},
	{
		name: 'files/directories',
		promise: FileModel.countDocuments(),
		model: FileModel.find(),
	},
	{
		name: 'files/sizes',
		promise: FileModel.aggregate([
			{
				$bucketAuto: {
					groupBy: '$size',
					buckets: 5,
				},
			},
		]),
		model: FileModel.find(),
	},
	{
		name: 'files/types',
		promise: FileModel.aggregate([
			{
				$group: {
					_id: '$type',
					total_files_per_type: { $sum: 1 },
				},
			},
		]),
		model: FileModel.find(),
	},
];

const fetchStatistics = () => {
	const statistics = {};

	return Promise.all(
		promises.map((p) =>
			p.promise.exec().then((res) => {
				statistics[p.name] = res;
				return res;
			})
		)
	).then(() => statistics);
};

class StatisticsService {
	constructor() {
		this.docs = swaggerDocs.statisticsService;
	}

	find() {
		return fetchStatistics().then((statistics) => statistics);
	}

	get(id, params) {
		return _.find(promises, { name: id })
			.model.select({ createdAt: 1 })
			.exec()
			.then((generic) => {
				const stats = generic.map((gen) => moment(gen.createdAt).format('YYYY-MM-DD'));

				const counts = {};
				stats.forEach((x) => {
					counts[x] = (counts[x] || 0) + 1;
				});

				const ordered = {};
				Object.keys(counts)
					.sort()
					.forEach((key) => {
						ordered[key] = counts[key];
					});

				const x = [];
				const y = [];

				if (params.query.returnArray) {
					for (const key in ordered) {
						if (ordered.hasOwnProperty(key)) {
							x.push(key);
							y.push(ordered[key]);
						}
					}
				}

				return params.query.returnArray ? { x, y } : ordered;
			});
	}
}

module.exports = function () {
	const app = this;

	app.use('/statistics/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/statistics', new StatisticsService());
	const statisticsService = app.service('/statistics');
	statisticsService.hooks(hooks);
};
