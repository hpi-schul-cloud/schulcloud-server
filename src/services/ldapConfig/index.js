'use strict';

const service = require('feathers-mongoose');
const models = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: models.ldapConfigModel,
		paginate: {
			default: 50,
			max: 250
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/ldapConfigs', service(options));

	// Get our initialize service to that we can bind hooks
	const ldapConfigService = app.service('/ldapConfigs');

	// Set up our before hooks
	ldapConfigService.before(hooks.before);

	// Set up our after hooks
	ldapConfigService.after(hooks.after);
};
