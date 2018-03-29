'use strict';

const service = require('feathers-mongoose');
const {homeworkModel, submissionModel, commentModel} = require('./model');
const hooks = require('./hooks');
const homeworkCopyHooks = require('./hooks/homework-copy');
const submissionHooks = require('./hooks/submissions');
const commentHooks = require('./hooks/comments');

module.exports = function() {
	const app = this;

	/* Homework model */
	app.use('/homework', service({
		Model: homeworkModel,
		paginate: {
			default: 100000,
			max: 100000
		}
	}));
	const hwService = app.service('/homework');
	hwService.before(hooks.before);
	hwService.after(hooks.after);

	/* Homework model */
	app.use('/homework/copy', service({
		Model: homeworkModel,
		paginate: {
			default: 100000,
			max: 100000
		}
	}));
	const hwCopyService = app.service('/homework/copy');
	hwCopyService.before(homeworkCopyHooks.before);
	hwCopyService.after(homeworkCopyHooks.after);

	/* Submission model */
	app.use('/submissions', service({
		Model: submissionModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const submissionService = app.service('/submissions');
	submissionService.before(submissionHooks.before);
	submissionService.after(submissionHooks.after);

	/* Comment model */
	app.use('/comments', service({
		Model: commentModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const commentService = app.service('/comments');
	commentService.before(commentHooks.before);
	commentService.after(commentHooks.after);
};
