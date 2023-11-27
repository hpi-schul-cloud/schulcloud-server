const service = require('feathers-mongoose');
const { homeworkModel, submissionModel } = require('./model');
const hooks = require('./hooks');
const submissionHooks = require('./hooks/submissions');

module.exports = function setup() {
	const app = this;

	/* Homework model */
	app.use(
		'/homework',
		service({
			Model: homeworkModel,
			paginate: {
				default: 100000,
				max: 100000,
			},
			lean: true,
		})
	);
	const hwService = app.service('/homework');
	hwService.hooks({
		before: hooks.before(),
		after: hooks.after,
	});

	/* Submission model */
	app.use(
		'/submissions',
		service({
			Model: submissionModel,
			paginate: {
				default: 500,
				max: 5000,
			},
			lean: true,
		})
	);
	const submissionService = app.service('/submissions');
	submissionService.hooks({
		before: submissionHooks.before(),
		after: submissionHooks.after,
	});
};
