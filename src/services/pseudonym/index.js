'use strict';
const service = require('feathers-mongoose');
const Pseudonym = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;
	const options = {
		Model: Pseudonym,
		paginate: {
			default: 1000,
			max: 1000
		}
	};

	app.use('/pseudonym', service(options));

	const pseudonymService = app.service('/pseudonym');
	pseudonymService.hooks({
		before: hooks.before,
		after: hooks.after
	});
};
