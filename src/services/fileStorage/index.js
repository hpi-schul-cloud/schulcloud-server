const modelService = require('./model-service');
const proxyService = require('./proxy-service');

module.exports = function init() {
	const app = this;
	// Setup proxy services
	app.configure(proxyService);
	// Setup model services
	app.configure(modelService);
};
