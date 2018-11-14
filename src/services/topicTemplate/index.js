'use strict';

const service = require('feathers-mongoose');
const topicTemplates = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;

	/* year Service */
	app.use(
		'/topicTemplates',
		service({
			Model: topicTemplates,
			paginate: {
				default: 500,
				max: 5000
			},
			lean: true
		})
	);

	const topicTemplateService = app.service('/topicTemplates');
	topicTemplateService.before(hooks.before);
	topicTemplateService.after(hooks.after);
};
