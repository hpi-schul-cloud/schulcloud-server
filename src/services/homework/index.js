const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const copyService = require('./copy-service');
const modelService = require('./model-service');

module.exports = (app) => {
	app.configure(copyService);
	app.configure(modelService);

	app.use('/homework/api', staticContent(path.join(__dirname, '/docs')));
};
