const modelService = require('./model-service');
const proxyService = require('./proxy-service');
const thumbnailService = require('./thumbnail-service');
const { service: SecurityCheckService } = require('./SecurityCheckService');

module.exports = (app) => {
	app.configure(proxyService);
	app.configure(modelService);

	app.configure(thumbnailService);
	app.configure(SecurityCheckService);
};
