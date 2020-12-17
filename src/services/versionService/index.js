const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const VersionService = require('./services/Version');
const versionServiceHooks = require('./hooks');

module.exports = (app) => {
	app.use('/version/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/version', new VersionService());
	app.service('/version').hooks(versionServiceHooks);
};
