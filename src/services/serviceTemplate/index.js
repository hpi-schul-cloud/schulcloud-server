const { modelService, modelServiceHooks } = require('./services/modelService');

/* In addition to setting up the service code, the service has to be included in src/index.js. */

module.exports = (app) => {
	app.use('/serviceTemplate/modelService', modelService);

	const serviceTemplate = app.service('/modelTemplate');
	serviceTemplate.hooks(modelServiceHooks);
};
