const copyService = require('./copy-service');
const modelService = require('./model-service');

module.exports = function init() {
	const app = this;
	// Setup copy services
	app.configure(copyService);
	// Setup model services
	app.configure(modelService);
};
