const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { datasourceService, datasourceHooks } = require('./services/datasources');
const { datasourceRunService, datasourceRunsHooks } = require('./services/datasourceRuns');

module.exports = function setup() {
	const app = this;

	app.use('/datasources/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/datasources', datasourceService);

	const datasourcesService = app.service('/datasources');
	datasourcesService.hooks(datasourceHooks);

	app.use('/datasourceRuns', datasourceRunService);
	const datasourcesRunsService = app.service('/datasourceRuns');
	datasourcesRunsService.hooks(datasourceRunsHooks);
};
