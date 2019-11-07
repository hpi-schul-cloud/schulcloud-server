const { modelService, modelServiceHooks } = require('./services/modelService');

module.exports = function setup() {
	const app = this;

	app.use('/serviceTemplate/modelService', modelService);

	const serviceTemplate = app.service('/modelTemplate');
	serviceTemplate.hooks(modelServiceHooks);
};
