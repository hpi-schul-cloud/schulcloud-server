'use strict';

const service = require('feathers-mongoose');
const topicInstances = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;

	/* topicInstances Service */
	app.use(
		'/topicInstances',
		service({
			Model: topicInstances,
			paginate: {
				default: 500,
				max: 5000
			},
			lean: true
		})
	);

	const topicInstancesService = app.service('/topicInstances');
	topicInstancesService.before(hooks.before);
	topicInstancesService.after(hooks.after);
};
