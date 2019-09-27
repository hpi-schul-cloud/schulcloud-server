const { datasourceService, datasourceHooks } = require('./services/datasources');
const { DatasourceRuns, datasourceRunsHooks } = require('./services/datasourceRuns');

module.exports = function setup() {
	const app = this;

	app.use('/datasources', datasourceService);

	const datasourcesService = app.service('/datasources');
	datasourcesService.hooks(datasourceHooks);

	app.use('/datasourceRuns', new DatasourceRuns());
	const datasourcesRunsService = app.service('/datasourceRuns');
	datasourcesRunsService.hooks(datasourceRunsHooks);
};
