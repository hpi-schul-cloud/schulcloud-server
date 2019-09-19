const { datasourceService, datasourceHooks } = require('./services/datasources');

module.exports = function setup() {
	const app = this;

	app.use('/datasources', datasourceService);

	const datasourcesService = app.service('/datasources');
	datasourcesService.hooks(datasourceHooks);

	/* app.use('/datasourceRuns', service({
		// Model: datasourceRunModel,
		paginate: {
			default: 10,
			max: 50,
		},
	})); */
	// const datasourcesService = app.service('/datasources');
	// hooks
};
