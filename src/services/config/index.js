const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { ConfigService, configServiceHooks } = require('./configService');
const { ConfigServiceV2, configServiceHooksV2 } = require('./configServiceV2');

module.exports = (app) => {
	app.use('/config/api', staticContent(path.join(__dirname, '/docs')));

	app.use('/config', new ConfigService());
	app.use('/config/v2', new ConfigServiceV2());
	app.service('/config').hooks(configServiceHooks);
	app.service('/config/v2').hooks(configServiceHooksV2);
};
