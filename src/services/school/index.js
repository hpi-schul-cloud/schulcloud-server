'use strict';

const service = require('feathers-mongoose');
const school = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require('./docs');

module.exports = function () {
	const app = this;

	const options = {
		Model: school,
		paginate: {
			default: 50,
			max: 250
		},
		lean: true
	};

	// Initialize our service with any options it requires
	var schoolServiceApp = service(options);
	schoolServiceApp.docs = swaggerDocs.schoolService;

	app.use('/schools', schoolServiceApp);

	// Get our initialize service to that we can bind hooks
	const schoolService = app.service('/schools');

	// Set up our before hooks
	schoolService.before(hooks.before);

	// Set up our after hooks
	schoolService.after(hooks.after);
};
