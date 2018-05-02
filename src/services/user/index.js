'use strict';

const service = require('feathers-mongoose');
const user = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require('./docs');

module.exports = function () {
	const app = this;

	const options = {
		Model: user,
		paginate: {
			default: 25,
			max: 1000
		},
		lean: true
	};

	// Initialize our service with any options it requires
	var userServiceApp = service(options);
	userServiceApp.docs = swaggerDocs.userService;

	app.use('/users', userServiceApp);

	// Get our initialize service to that we can bind hooks
	const userService = app.service('/users');

	// Set up our before hooks
	userService.before(hooks.before(app));	// TODO: refactor

	// Set up our after hooks
	userService.after(hooks.after);
};
