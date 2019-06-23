const modelService = require('./model-service');
const proxyService = require('./proxy-service');
const thumbnailService = require('./thumbnail-service');

module.exports = function () {
	const app = this;
	// Setup proxy services
	app.configure(proxyService);
	// Setup model services
	app.configure(modelService);
	// Setup popo
	app.configure(thumbnailService);
};
