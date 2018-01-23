'use strict';

const service = require('feathers-mongoose');
const {courseModel, courseGroupModel, classModel, gradeModel} = require('./model');
const hooks = require('./hooks');
const courseGroupsHooks = require('./hooks/courseGroups');

module.exports = function() {
	const app = this;

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
	classService.before(hooks.before);
	classService.after(hooks.after);


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
