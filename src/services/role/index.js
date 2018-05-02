'use strict';

const service = require('feathers-mongoose');
const role = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require('./docs/');

module.exports = function () {
	const app = this;

	const options = {
		Model: role,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	};

	// Initialize our service with any options it requires
	var roleServiceApp = service(options);
	roleServiceApp.docs = swaggerDocs.roleService;

	app.use('/roles', roleServiceApp);

	// Get our initialize service to that we can bind hooks
	const roleService = app.service('/roles');

	// Set up our before hooks
	roleService.before(hooks.before(app));

	// Set up our after hooks
	roleService.after(hooks.after);
};
