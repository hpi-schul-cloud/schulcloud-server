const service = require('feathers-mongoose');
const {
	courseModel,
	courseGroupModel,
	classModel,
	gradeModel,
} = require('./model');
const hooks = require('./hooks');
const courseGroupsHooks = require('./hooks/courseGroups');
const courseCopyService = require('./course-copy-service');
const classHooks = require('./hooks/classes');
const { /* ScopePermissionService, */ ScopeListService } = require('../helpers/scopePermissions');

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	app.configure(courseCopyService);

	/* Course model */
	app.use('/courses', service({
		Model: courseModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	}));
	const courseService = app.service('/courses');
	courseService.hooks(hooks);

	/* CourseGroup model */
	app.use('/courseGroups', service({
		Model: courseGroupModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	}));
	const courseGroupService = app.service('/courseGroups');
	courseGroupService.hooks(courseGroupsHooks);

	/* Class model */
	app.use('/classes', service({
		Model: classModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: { virtuals: true },
	}));
	const classService = app.service('/classes');
	classService.hooks(classHooks);

	/* Grade model */
	app.use('/grades', service({
		Model: gradeModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	}));
	const gradeService = app.service('/grades');
	gradeService.hooks(hooks);

	ScopeListService.initialize(app, '/users/:scopeId/courses', async (user, permissions, params) => {
		let filter = 'active';
		let substitution = 'false';
		if (params.query.filter && ['active', 'archived', 'all'].includes(params.query.filter)) {
			({ filter } = params.query);
		}
		if (params.query.substitution && ['true', 'false', 'all'].includes(params.query.substitution)) {
			({ substitution } = params.query);
		}

		const userQuery = { $or: [] };
		if (['false', 'all'].includes(substitution)) {
			userQuery.$or.push(
				{ userIds: user._id },
				{ teacherIds: user._id },
			);
		}
		if (['true', 'all'].includes(substitution)) userQuery.$or.push({ substitutionIds: user._id });

		let untilQuery = {};
		if (filter === 'active') {
			untilQuery = {
				$or: [
					{ untilDate: { $exists: false } },
					{ untilDate: { $gte: Date.now() } },
				],
			};
		}
		if (filter === 'archived') {
			untilQuery = { untilDate: { $lt: Date.now() } };
		}

		return app.service('courses').find({
			query: {
				$and: [
					userQuery,
					untilQuery,
				],
			},
			paginate: params.paginate,
		});
	});
};
