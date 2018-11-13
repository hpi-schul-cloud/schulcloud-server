'use strict';

const service = require('feathers-mongoose');
const subjectType = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;

	/* year Service */
	app.use(
		'/subjectTypes',
		service({
			Model: subjectType,
			paginate: {
				default: 500,
				max: 5000
			},
			lean: true
		})
	);

	const subjectTypeService = app.service('/subjectTypes');
	subjectTypeService.before(hooks.before);
	subjectTypeService.after(hooks.after);
};
