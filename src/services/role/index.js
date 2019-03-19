const service = require('feathers-mongoose');
const role = require('./model');
const hooks = require('./hooks');

module.exports = function init() {
	const app = this;

	const options = {
		Model: role,
		paginate: {
			default: 10,
			max: 25,
		},
		lean: true,
	};

	// Initialize our service with any options it requires
	app.use('/roles', service(options));

	// Get our initialize service to that we can bind hooks
	const roleService = app.service('/roles');

	// Set up our before hooks
	roleService.before(hooks.before(app));

	// Set up our after hooks
	roleService.after(hooks.after);
};
