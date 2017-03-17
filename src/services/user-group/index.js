'use strict';

const service = require('feathers-mongoose');
const {courseModel, classModel, homeworkModel, submissionModel, gradeModel} = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;


	/* Homework model */
	app.use('/homework', service({
		Model: homeworkModel,
		paginate: {
			default: 25,
			max: 100
		}
	}));
	const hwService = app.service('/homework');
	hwService.before(hooks.before);
	hwService.after(hooks.after);

	/* Submission model */
	app.use('/submissions', service({
		Model: submissionModel,
		paginate: {
			default: 25,
			max: 100
		}
	}));
	const submissionService = app.service('/submissions');
	submissionService.before(hooks.before);
	submissionService.after(hooks.after);

	/* Course model */
	app.use('/courses', service({
		Model: courseModel,
		paginate: {
			default: 25,
			max: 100
		}
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
		}
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
		}
	}));
	const gradeService = app.service('/grades');
	gradeService.before(hooks.before);
	gradeService.after(hooks.after);
};
