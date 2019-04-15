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
			default: 100000,
			max: 100000
		}
	}));
	const hwService = app.service('/homework');
	hwService.hooks(hooks);

	/* Submission model */
	app.use('/submissions', service({
		Model: submissionModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const submissionService = app.service('/submissions');
	submissionService.hooks(submissionHooks);

	/* Comment model */
	app.use('/comments', service({
		Model: commentModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const commentService = app.service('/comments');
	commentService.hooks(commentHooks);
};
