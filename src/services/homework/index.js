'use strict';
const copyService = require('./copy-service');
const modelService = require('./model-service');

module.exports = function () {
	const app = this;
	// Setup copy services
	app.configure(copyService);
	// Setup model services
	app.configure(modelService);
};
