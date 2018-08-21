'use strict';

const service = require('feathers-mongoose');
const user = require('./model');
const hooks = require('./hooks');
const registrationPinsHooks = require('./hooks/registrationPins');

module.exports = function () {
	const app = this;

	const options = {
		Model: user.userModel,
		paginate: {
			default: 25,
			max: 1000
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/users', service(options));

	// Get our initialize service to that we can bind hooks
	const userService = app.service('/users');

	// Set up our before hooks
	userService.before(hooks.before(app));	// TODO: refactor

	// Set up our after hooks
	userService.after(hooks.after);

	/* registrationPin Service */
	app.use('/registrationPins', service({
		Model: user.registrationPinModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const registrationPinService = app.service('/registrationPins');
	registrationPinService.before(registrationPinsHooks.before);
	registrationPinService.after(registrationPinsHooks.after);
};
