const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const modelService = require('./model-service');

module.exports = (app) => {
	app.use('/homework/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.configure(modelService);
};
