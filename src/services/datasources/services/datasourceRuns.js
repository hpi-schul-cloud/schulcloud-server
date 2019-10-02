const Ajv = require('ajv');
const auth = require('@feathersjs/authentication');
const {
	iff, isProvider, validateSchema, disallow,
} = require('feathers-hooks-common');
const { customHook } = require('../hooks');
const { hasPermission } = require('../../../hooks');

const createSchema = require('../schemas/datasourceRuns.create.schema');
const { datasourceRunModel } = require('../model');

class DatasourceRuns {
	constructor(options) {
		this.options = options || {};
	}

	registerEventListeners() {

	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}

	find(params) {
		return {};
	}

	get(id, params) {
		return {};
	}

	async create(data, params) {
		const datasource = await this.app.service('datasources').get(data.datasourceId);
		const startTime = Date.now();
		const result = data.data
			? await this.app.service('sync').create({ data: data.data }, { query: datasource.config })
			: await this.app.service('sync').find({ query: datasource.config });
		const endTime = Date.now();

		let status = 'Success';
		result.forEach((e) => {
			if (!e.success) status = 'Error';
		});

		const dsrData = {
			datasourceId: data.datasourceId,
			status,
			config: datasource.config,
			dryrun: data.dryrun || false,
			createdBy: (params.account || {}).userId,
			duration: endTime - startTime,
		};
		const modelResult = await datasourceRunModel.create(dsrData);
		return Promise.resolve(modelResult);
	}
}

/**
 * hooks should be used for validation and authorisation, and very simple logic.
 * If your service requires more complicated logic, implement a custom service.
 * use disallow() to disable any methods that are not supposed to be used.
 * more hooks can be found at https://feathers-plus.github.io/v1/feathers-hooks-common/index.html#Hooks.
 */
const datasourceRunsHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [
			iff(isProvider('external'), hasPermission('DATASOURCES_VIEW')),
		],
		get: [
			iff(isProvider('external'), hasPermission('DATASOURCES_VIEW')),
		],
		create: [
			iff(isProvider('external'), [
				validateSchema(createSchema, Ajv),
				hasPermission('DATASOURCES_RUN'),
			]),
		],
		update: [
			disallow(),
		],
		patch: [
			disallow(),
		],
		remove: [
			disallow(),
		],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
	},
};

module.exports = { DatasourceRuns, datasourceRunsHooks };
