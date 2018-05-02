'use strict';

const service = require('feathers-mongoose');
const system = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require('./docs');
module.exports = function () {
	const app = this;

	const options = {
		Model: system,
		paginate: {
			default: 5,
			max: 25
		},
		lean: true
	};

	// Initialize our service with any options it requires
	var systemServiceApp = service(options);
	systemServiceApp.docs = swaggerDocs.systemService;

	app.use('/systems', systemServiceApp);

	// Get our initialize service to that we can bind hooks
	const systemService = app.service('/systems');

	// Set up our before hooks
	systemService.before(hooks.before);

	// Set up our after hooks
	systemService.after(hooks.after);
};
