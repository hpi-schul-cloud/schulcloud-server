const service = require('feathers-mongoose');
const federalState = require('./model');
const hooks = require('./hooks');

module.exports = function init() {
	const app = this;

	const options = {
		Model: federalState,
		paginate: {
			default: 16,
			max: 25,
		},
		lean: true,
	};

	// Initialize our service with any options it requires
	app.use('/federalStates', service(options));

	// Get our initialize service to that we can bind hooks
	const federalStateService = app.service('/federalStates');

	// Set up our before hooks
	federalStateService.before(hooks.before);

	// Set up our after hooks
	federalStateService.after(hooks.after);
};
