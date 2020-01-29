const { webuntisMetadataService, webuntisMetadataServiceHooks } = require('./services/webuntisMetadata');

/* In addition to setting up the service code, the service has to be included in src/index.js. */

module.exports = (app) => {
	app.use('/webuntisMetadata', webuntisMetadataService);

	const serviceTemplate = app.service('/webuntisMetadata');
	serviceTemplate.hooks(webuntisMetadataServiceHooks);
};
