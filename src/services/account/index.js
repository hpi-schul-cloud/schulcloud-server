const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { supportJWTServiceSetup, jwtTimerServiceSetup } = require('./services');

module.exports = (app) => {
	app.use('/accounts/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.configure(jwtTimerServiceSetup);

	app.configure(supportJWTServiceSetup); // TODO: Remove me
};
