const service = require('feathers-mongoose');
const { datasourceModel, datasourceRunModel } = require('./model');

module.exports = function setup() {
	const app = this;

	app.use('/datasources', service({
		Model: datasourceModel,
		paginate: {
			default: 10,
			max: 50,
		},
	}));
	// const datasourcesService = app.service('/datasources');
	// hooks

	app.use('/datasourceRuns', service({
		Model: datasourceRunModel,
		paginate: {
			default: 10,
			max: 50,
		},
	}));
	// const datasourcesService = app.service('/datasources');
	// hooks
};
