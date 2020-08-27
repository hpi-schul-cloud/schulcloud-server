const modelService = require('./model-service');
const proxyService = require('./proxy-service');
const thumbnailService = require('./thumbnail-service');
const { service: securityCheckService } = require('./SecurityCheckService');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = (app) => {
	app.configure(proxyService);
	app.configure(modelService);

	app.configure(thumbnailService);
	app.configure(securityCheckService);

	app.use('/fileStorage/api', staticContent(path.join(__dirname, '/docs')));
};
