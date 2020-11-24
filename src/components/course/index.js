const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = (app) => {
	app.use('/courses/v2/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
};
