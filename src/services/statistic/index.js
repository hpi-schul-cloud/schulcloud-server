const moment = require('moment');
const _ = require('lodash');
const hooks = require('./hooks/index');
const swaggerDocs = require('./docs');
const schoolModel = require('../school/model');
const userModel = require('../user/model');
const accountModel = require('../account/model');
const homeworkModel = require('../homework/model');
const lessonModel = require('../lesson/model');
const teamsModel = require('../teams/model');
const groupModel = require('../user-group/model');
const { FileModel } = require('../fileStorage/model');
const { hasPermissionNoHook } = require('../../hooks');
const { PERMISSIONS } = require('./logic/constants');

const getPromises = (schoolId) => {
	const roleTeacher = '0000d186816abba584714c98';
	const roleStudent = '0000d186816abba584714c99';

	const schoolIdFilter = schoolId ? { schoolId } : {};

	let promises = [
		{
			name: 'users',
			promise: userModel.userModel.countDocuments(schoolIdFilter),
			model: userModel.userModel.find(schoolIdFilter),
		},
		{
			name: 'homework',
			promise: homeworkModel.homeworkModel.countDocuments(schoolIdFilter),
			model: homeworkModel.homeworkModel.find(schoolIdFilter),
		},
		{
			name: 'submissions',
			promise: homeworkModel.submissionModel.countDocuments(schoolIdFilter),
			model: homeworkModel.submissionModel.find(schoolIdFilter),
		},
		{
			name: 'classes',
			promise: groupModel.classModel.countDocuments(schoolIdFilter),
			model: groupModel.classModel.find(schoolIdFilter),
		},
		{
			name: 'courses',
			promise: groupModel.courseModel.countDocuments(schoolIdFilter),
			model: groupModel.courseModel.find(schoolIdFilter),
		},
		{
			name: 'teams',
			promise: teamsModel.teamsModel.countDocuments(schoolIdFilter),
			model: teamsModel.teamsModel.find(schoolIdFilter),
		},
		{
			name: 'teachers',
			promise: userModel.userModel.countDocuments(
				schoolId
					? { roles: roleTeacher, schoolId }
					: { roles: roleTeacher },
			),
			model: userModel.userModel.find(
				schoolId
					? { roles: roleTeacher, schoolId }
					: { roles: roleTeacher },
			),
		},
		{
			name: 'students',
			promise: userModel.userModel.countDocuments(
				schoolId
					? { roles: roleStudent, schoolId }
					: { roles: roleStudent },
			),
			model: userModel.userModel.find(
				schoolId
					? { roles: roleStudent, schoolId }
					: { roles: roleStudent },
			),
		},
	];

	const promisesWithoutSchoolIds = [
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
			name: 'teams',
			promise: teamsModel.teamsModel.countDocuments(),
			model: teamsModel.teamsModel.find(),
		},
		{
			name: 'lessons',
			promise: lessonModel.countDocuments(),
			model: lessonModel.find(),
		},
		{
			name: 'files_directories',
			promise: FileModel.countDocuments(),
			model: FileModel.find(),
		},
		{
			name: 'files_sizes',
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
			name: 'files_types',
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

	if (!schoolId) {
		promises = [...promises, ...promisesWithoutSchoolIds];
	}

	return promises;
};

const fetchStatistics = (schoolId) => {
	const statistics = {};

	return Promise.all(getPromises(schoolId).map((p) => p.promise.exec().then((res) => {
		statistics[p.name] = res;
		return res;
	}))).then((_) => statistics);
};

class StatisticsService {
	constructor() {
		this.docs = swaggerDocs.statisticsService;
	}

	setup(app) {
		this.app = app;
	}

	async find({
		query, params, account, app,
	}) {
		let statistics;
		// TODO: Promise.all
		const hasViewMySchoolStatsPermission = await hasPermissionNoHook(
			this, account.userId, PERMISSIONS.VIEW_MYSCHOOL_STATS,
		);
		const hasViewGlobalStatsPermission = await hasPermissionNoHook(
			this, account.userId, PERMISSIONS.VIEW_GLOBAL_STATS,
		);
		if (query.school === 'myschool' && hasViewMySchoolStatsPermission) {
			statistics = await fetchStatistics(account.schoolId);
		} else if (hasViewGlobalStatsPermission) {
			statistics = await fetchStatistics();
		}
		return statistics;
	}

	get(id, params) {
		return _.find(getPromises(), { name: id })
			.model.select({ createdAt: 1 })
			.exec()
			.then((generic) => {
				const stats = generic.map((gen) => moment(gen.createdAt).toISOString());

				const counts = {};
				stats.forEach((x) => { 
					counts[x] = (counts[x] || 0) + 1; 
				});

				let incrementedCount = 0;
				const ordered = [];
				Object.keys(counts)
					.sort()
					.forEach((key) => {
						incrementedCount += counts[key];
						ordered.push([key, incrementedCount]);
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

	app.use('/statistics', new StatisticsService());
	const statisticsService = app.service('/statistics');
	statisticsService.hooks(hooks);
};
