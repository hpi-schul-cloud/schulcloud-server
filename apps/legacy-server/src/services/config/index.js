const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { ConfigService, configServiceHooks } = require('./configService');

module.exports = (app) => {
	app.use('/config/api', staticContent(path.join(__dirname, '/docs')));

	app.use('/config', new ConfigService());
	app.service('/config').hooks(configServiceHooks);
};
