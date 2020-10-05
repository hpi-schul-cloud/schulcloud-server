const { ConfigService, configServiceHooks } = require('./configService');

module.exports = (app) => {
	app.use('/config', new ConfigService());
	app.service('/config').hooks(configServiceHooks);
};
