'use strict';

const service = require('feathers-mongoose');
const lesson = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: lesson,
		paginate: {
			default: 10,
			max: 50
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/lessons', service(options));

	// Get our initialize service to that we can bind hooks
	const systemService = app.service('/lessons');

	// Set up our before hooks
	systemService.before(hooks.before);

	// Set up our after hooks
	systemService.after(hooks.after);
};
