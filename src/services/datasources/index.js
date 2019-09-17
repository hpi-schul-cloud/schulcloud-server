const auth = require('@feathersjs/authentication');
const service = require('feathers-mongoose');

const globalHooks = require('../../hooks');
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
	const datasourceHooks = {
		before: {
			all: [
				auth.hooks.authenticate('jwt'),
				globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
			],
			find: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_VIEW'))],
			get: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_VIEW'))],
			create: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_CREATE'))],
			update: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_EDIT'))],
			patch: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_EDIT'))],
			remove: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_DELETE'))],
		},
		after: {
			all: [],
			find: [],
			get: [],
			create: [],
			update: [],
			patch: [],
			remove: [],
		},
	};
	const datasourcesService = app.service('/datasources');
	datasourcesService.hooks(datasourceHooks);

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
