const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { registerApiValidation } = require('../../utils/apiValidation');

module.exports = (app) => {
	registerApiValidation(app, path.join(__dirname, '/docs/openapi.yaml'));
	app.use('/courses/v2/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
};
