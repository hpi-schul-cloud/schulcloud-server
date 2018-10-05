'use strict';

const service = require('feathers-mongoose');
const {teamsModel} = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: teamsModel,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/teams', service(options));

	// Get our initialize service to that we can bind hooks
	const teamsServices = app.service('/teams');

	// Set up our before hooks
	teamsServices.before(hooks.before);

	// Set up our after hooks
	teamsServices.after(hooks.after);
};