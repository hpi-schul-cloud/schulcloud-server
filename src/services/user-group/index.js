'use strict';

const service = require('feathers-mongoose');
const {courseModel, courseGroupModel, classModel, gradeModel} = require('./model');
const hooks = require('./hooks');
const courseGroupsHooks = require('./hooks/courseGroups');
const courseCopyService = require('./course-copy-service');
const classHooks = require('./hooks/classes');

module.exports = function() {
	const app = this;

	app.configure(courseCopyService);

	/* Course model */
	app.use('/courses', service({
		Model: courseModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const courseService = app.service('/courses');
	courseService.before(hooks.before);
	courseService.after(hooks.after);

	/* CourseGroup model */
	app.use('/courseGroups', service({
		Model: courseGroupModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const courseGroupService = app.service('/courseGroups');
	courseGroupService.before(courseGroupsHooks.before);
	courseGroupService.after(courseGroupsHooks.after);


	/* Class model */
	app.use('/classes', service({
		Model: classModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const classService = app.service('/classes');
	classService.before(classHooks.before);
	classService.after(classHooks.after);


	/* Grade model */
	app.use('/grades', service({
		Model: gradeModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const gradeService = app.service('/grades');
	gradeService.before(hooks.before);
	gradeService.after(hooks.after);
};
