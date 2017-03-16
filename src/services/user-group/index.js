'use strict';

const service = require('feathers-mongoose');
const {courseModel, classModel, gradeModel} = require('./model');
const hooks = require('./hooks');

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
