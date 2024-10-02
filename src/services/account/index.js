const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { jwtTimerServiceSetup } = require('./services');

module.exports = (app) => {
	app.use('/accounts/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.configure(jwtTimerServiceSetup);
};
