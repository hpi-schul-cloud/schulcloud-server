const reqlib = require('app-root-path').require;
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { registerApiValidation } = reqlib('src/utils/apiValidation');

module.exports = (app) => {
	registerApiValidation(app, path.join(__dirname, '/openapi.yaml'));
	app.use('/legacy/v1/api', staticContent(path.join(__dirname, '/openapi.yaml')));
};
