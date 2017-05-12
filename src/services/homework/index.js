'use strict';

const service = require('feathers-mongoose');
const {homeworkModel, submissionModel, commentModel} = require('./model');
const hooks = require('./hooks');
const submissionHooks = require('./hooks/submissions');
const commentHooks = require('./hooks/comments');

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
	submissionService.before(submissionHooks.before);
	submissionService.after(submissionHooks.after);

	/* Comment model */
	app.use('/comments', service({
		Model: commentModel,
		paginate: {
			default: 25,
			max: 100
		}
	}));
	const commentService = app.service('/comments');
	commentService.before(commentHooks.before);
	commentService.after(commentHooks.after);
};
