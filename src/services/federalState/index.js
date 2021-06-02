const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const federalState = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	app.use('/federalStates/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	const options = {
		Model: federalState,
		paginate: {
			default: 20,
			max: 25,
		},
		lean: true,
	};

	app.use('/federalStates', service(options));
	const federalStateService = app.service('/federalStates');
	federalStateService.hooks(hooks);
};
