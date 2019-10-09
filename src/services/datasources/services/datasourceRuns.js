const Ajv = require('ajv');
const { Writable } = require('stream');
const {	Forbidden } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const {
	iff, isProvider, validateSchema, disallow,
} = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');
const { flatten, paginate, convertToSortOrderObject } = require('../../../utils/array');

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

	async find(params) {
		let { schoolId } = params;
		if (params.account) {
			({ schoolId } = await this.app.service('users').get(params.account.userId));
		}
		const query = params.query || {};
		const filter = {};
		if (schoolId) filter.schoolId = schoolId;
		if (params.datasourceId) filter.datasourceId = params.datasourceId;

		const result = await datasourceRunModel.find(
			filter,
			'datasourceId _id status dryrun duration',
		).sort(query.sort);
		return result;
	}

	/**
	 * returns detailed informaton about a specific run of a datasource, including complete logs.
	 * @param {ObjectId} id id of a datasourceRun
	 * @param {Object} params feathers params object.
	 */
	async get(id, params) {
		const datasourceRun = await datasourceRunModel.findById(id);

		if (params.account) {
			const [user, datasource] = await Promise.all([
				this.app.service('users').get(params.account.userId),
				this.app.service('datasources').get(datasourceRun.datasourceId),
			]);
			if (user.schoolId.toString() !== datasource.schoolId.toString()) {
				throw new Forbidden('You do not have valid permission to access this.');
			}
		}

		return datasourceRun;
	}

	/**
	 * Run a sync for a specific datasource, with its current config and passed data.
	 * The results and logs of the run get saved and can be reviewed later.
	 * @param {Object} data userdata, has to conform to the datasourceRuns.create.schema.json.
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		const datasource = await this.app.service('datasources').get(data.datasourceId);

		if (params.account) {
			const user = await this.app.service('users').get(params.account.userId);
			if (user.schoolId.toString() !== datasource.schoolId.toString()) {
				throw new Forbidden('You do not have valid permissions to access this.');
			}
		}

		// set up stream for the sync log
		let logString = '';
		const logStream = new Writable({
			write(chunk, encoding, callback) {
				logString += chunk.toString();
				callback();
			},
		});

		// run a syncer
		const startTime = Date.now();
		const result = data.data
			? await this.app.service('sync').create({ data: data.data }, { logStream, query: datasource.config })
			: await this.app.service('sync').find({ logStream, query: datasource.config });
		const endTime = Date.now();

		// determine status
		let status = 'Success';
		result.forEach((e) => {
			if (!e.success) status = 'Error';
		});

		// save to database
		const dsrData = {
			datasourceId: data.datasourceId,
			status,
			log: logString,
			config: datasource.config,
			schoolId: datasource.schoolId,
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
			authenticate('jwt'),
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
