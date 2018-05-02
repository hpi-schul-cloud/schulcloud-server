'use strict';

const service = require('feathers-mongoose');
const {homeworkModel, submissionModel, commentModel} = require('./model');
const hooks = require('./hooks');
const submissionHooks = require('./hooks/submissions');
const commentHooks = require('./hooks/comments');
const swaggerDocs = require('./docs/');

module.exports = function() {
	const app = this;

	/* Homework model */
	var homeworkService = service({
		Model: homeworkModel,
		paginate: {
			default: 100000,
			max: 100000
		}
	});
	homeworkService.docs = swaggerDocs.homeworkService;

	app.use('/homework', homeworkService);
	const hwService = app.service('/homework');
	hwService.before(hooks.before);
	hwService.after(hooks.after);

	/* Submission model */
	var submissionServiceApp = service({
		Model: submissionModel,
		paginate: {
			default: 500,
			max: 5000
		}
	});
	submissionServiceApp.docs = swaggerDocs.submissionService;

	app.use('/submissions', submissionServiceApp);
	const submissionService = app.service('/submissions');
	submissionService.before(submissionHooks.before);
	submissionService.after(submissionHooks.after);

	/* Comment model */
	var commentServiceApp = service({
		Model: commentModel,
		paginate: {
			default: 500,
			max: 5000
		}
	});
	commentServiceApp.docs = swaggerDocs.commentService;
	app.use('/comments', commentServiceApp);
	const commentService = app.service('/comments');
	commentService.before(commentHooks.before);
	commentService.after(commentHooks.after);
};
