const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const modelService = require('./model-service');
const proxyService = require('./proxy-service');
const thumbnailService = require('./thumbnail-service');
const { service: securityCheckService } = require('./SecurityCheckService');

module.exports = (app) => {
	app.use('/fileStorage/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.configure(proxyService);
	app.configure(modelService);

	app.configure(thumbnailService);
	app.configure(securityCheckService);
};
