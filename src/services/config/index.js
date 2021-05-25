const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { ConfigService, configServiceHooks } = require('./configService');
const { PublicAppConfigService, publicAppConfigServiceHooks } = require('./publicAppConfigService');

module.exports = (app) => {
	app.use('/config/api', staticContent(path.join(__dirname, '/docs')));

	app.use('/config/app/public', new PublicAppConfigService());
	app.service('/config/app/public').hooks(publicAppConfigServiceHooks);

	app.use('/config', new ConfigService());
	app.service('/config').hooks(configServiceHooks);
};
