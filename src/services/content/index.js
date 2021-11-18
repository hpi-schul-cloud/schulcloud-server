// eslint-disable-next-line max-classes-per-file
const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const material = require('./material-model');

const materialsHooks = require('./hooks/materials');

module.exports = function () {
	const app = this;

	app.use('/content/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	const options = {
		Model: material,
		paginate: {
			default: 10,
			max: 25,
		},
		lean: true,
	};

	app.use('/materials', service(options));

	const materialsService = app.service('/materials');

	materialsService.hooks(materialsHooks);
};
