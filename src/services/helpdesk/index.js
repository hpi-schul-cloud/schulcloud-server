'use strict';

const service = require('feathers-mongoose');
const problemModel = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: problemModel,
		paginate: {
			default: 25,
			max: 1000
		},
		lean: true
	};

	app.use('/helpdesk', service(options));
	const helpdeskService = app.service('/helpdesk');
	helpdeskService.hooks(hooks);
};
