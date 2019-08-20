const service = require('feathers-mongoose');
const {
	courseModel,
	courseGroupModel,
	classModel,
	gradeModel,
} = require('./model');
const hooks = require('./hooks');
const courseGroupsHooks = require('./hooks/courseGroups');
const courseCopyService = require('./services/course-copy-service');
const courseScopelistService = require('./services/courseScopeLists');
const classHooks = require('./hooks/classes');

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
		lean: { virtuals: true },
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

	app.configure(courseScopelistService);
};
