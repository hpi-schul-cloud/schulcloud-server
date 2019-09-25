const { simpleService, simpleServiceHooks } = require('./services/simpleService');

module.exports = function setup() {
	const app = this;

	app.use('/serviceTemplate/simpleService', simpleService);

	const serviceTemplate = app.service('/serviceTemplate');
	serviceTemplate.hooks(simpleServiceHooks);
};
