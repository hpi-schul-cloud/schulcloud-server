'use strict';

const service = require('feathers-mongoose');
const user = require('./model');
const hooks = require('./hooks');

class userBatchImportService {

}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/users/import', new userBatchImportService());

	// Get our initialize service to that we can bind hooks
	const userBatchImportService = app.service('/users/import');

	// Set up our before hooks
	userService.before(hooks.before(app));	// TODO: refactor

	// Set up our after hooks
	userService.after(hooks.after);
};