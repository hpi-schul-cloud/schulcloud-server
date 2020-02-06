const service = require('feathers-mongoose');
const Pseudonym = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;
	const options = {
		Model: Pseudonym,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: false,
	};

	app.use('/pseudonym', service(options));

	const pseudonymService = app.service('/pseudonym');
	pseudonymService.hooks(hooks);
};
