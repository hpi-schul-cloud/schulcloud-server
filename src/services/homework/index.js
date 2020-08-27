const copyService = require('./copy-service');
const modelService = require('./model-service');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = (app) => {
	app.configure(copyService);
	app.configure(modelService);

	app.use('/homework/api', staticContent(path.join(__dirname, '/docs')));
};
