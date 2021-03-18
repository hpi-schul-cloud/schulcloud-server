const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const system = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	app.use('/systems/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	const options = {
		Model: system,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: true,
		multi: true,
	};

	app.use('/systems', service(options));
	const systemService = app.service('/systems');
	systemService.hooks(hooks);
};
