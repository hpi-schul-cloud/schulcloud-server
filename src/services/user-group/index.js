'use strict';

const service = require('feathers-mongoose');
const {courseModel, courseGroupModel, classModel, gradeModel} = require('./model');
const hooks = require('./hooks');
const courseGroupsHooks = require('./hooks/courseGroups');
const swaggerDocs = require('./docs');

module.exports = function() {
	const app = this;

	/* Course model */
	var coursesServiceApp = service({
		Model: courseModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	});
	coursesServiceApp.docs = swaggerDocs.coursesService;
	app.use('/courses', coursesServiceApp);
	const courseService = app.service('/courses');
	courseService.before(hooks.before);
	courseService.after(hooks.after);

	/* CourseGroup model */
	var courseGroupServiceApp = service({
		Model: courseGroupModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	});
	courseGroupServiceApp.docs = swaggerDocs.courseGroupsService;
	app.use('/courseGroups', courseGroupServiceApp);
	const courseGroupService = app.service('/courseGroups');
	courseGroupService.before(courseGroupsHooks.before);
	courseGroupService.after(courseGroupsHooks.after);


	/* Class model */
	var classServiceApp = service({
		Model: classModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	});
	classServiceApp.docs = swaggerDocs.classesService;
	app.use('/classes', classServiceApp);
	const classService = app.service('/classes');
	classService.before(hooks.before);
	classService.after(hooks.after);


	/* Grade model */
	var gradeServiceApp = service({
		Model: gradeModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	});
	gradeServiceApp.docs = swaggerDocs.gradeService;
	app.use('/grades', gradeServiceApp);
	const gradeService = app.service('/grades');
	gradeService.before(hooks.before);
	gradeService.after(hooks.after);
};
