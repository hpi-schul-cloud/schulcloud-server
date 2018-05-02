'use strict';

const service = require('feathers-mongoose');
const problemModel = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require('./docs/');

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

	var helpdeskServiceApp = service(options);
	helpdeskServiceApp.docs = swaggerDocs.helpdeskService;

	// Initialize our service with any options it requires
	app.use('/helpdesk', helpdeskServiceApp);

	// Get our initialize service to that we can bind hooks
	const helpdeskService = app.service('/helpdesk');

	// Set up our before hooks
	helpdeskService.before(hooks.before);

	// Set up our after hooks
	helpdeskService.after(hooks.after);
};
