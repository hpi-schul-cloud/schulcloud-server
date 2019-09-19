const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const service = require('feathers-mongoose');

const globalHooks = require('../../hooks');
const { validateData, updatedBy, createdBy } = require('./hooks');
const { datasourceModel/* , datasourceRunModel */ } = require('./model');

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
			],
			find: [
				globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
				globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_VIEW')),
			],
			get: [globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_VIEW'))],
			create: [
				globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_CREATE')),
				globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
				globalHooks.ifNotLocal(validateData),
				globalHooks.ifNotLocal(createdBy),
			],
			update: [hooks.disallow()],
			patch: [
				globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
				globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_EDIT')),
				globalHooks.ifNotLocal(validateData),
				globalHooks.ifNotLocal(updatedBy),
			],
			remove: [
				globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
				globalHooks.ifNotLocal(globalHooks.hasPermission('DATASOURCES_DELETE')),
			],
		},
		after: {
			all: [],
			find: [],
			get: [
				globalHooks.ifNotLocal(
					globalHooks.denyIfNotCurrentSchool({
						errorMessage: 'You do not have valid permissions to access this.',
					}),
				),
			],
			create: [],
			update: [],
			patch: [],
			remove: [],
		},
	};
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
