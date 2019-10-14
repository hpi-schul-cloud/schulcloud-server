const Ajv = require('ajv');
const { Writable } = require('stream');
const {	Forbidden } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const {
	iff, isProvider, validateSchema, disallow,
} = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');
const { getDatasource, restrictToDatasourceSchool } = require('../hooks');

const { datasourceRunCreateSchema } = require('../schemas');
const { datasourceRunModel } = require('../model');
const { SUCCESS, ERROR } = require('../constants');

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

	/**
	 * sets pagination parameters for further use, imitating feathers.
	 * Handles defaults and max values set by the service.
	 * @param {Object} query feathers Query
	 * @param {Object} serviceOptions Service options, potentially containing pagination settings
	 */
	injectPaginationQuery(query, serviceOptions) {
		if (typeof (serviceOptions || {}).paginate === 'object') {
			const resultQuery = Object.assign({}, { $paginate: true }, query);
			if (!resultQuery.$limit) resultQuery.$limit = serviceOptions.paginate.default;
			if (resultQuery.$limit > serviceOptions.max) resultQuery.$limit = serviceOptions.paginate.max;
			return resultQuery;
		}
		return query;
	}

	/**
	 * Formats an array of data as an object containing pagination infos.
	 * DOES NOT PAGINATE! data is expected to already be the paginated results.
	 * @param {Array} data pre-paginated data
	 * @param {Object} query feathers query containing $limit and $skip
	 */
	paginationLikeFormat(data, query) {
		if (query.$paginate) {
			return {
				total: data.length,
				limit: query.$limit,
				skip: query.$skip,
				data,
			};
		}
		return data;
	}

	/**
	 * returns basic information on all datasource runs for the school of a user, or a specified datasource.
	 * for internal users, may also return runs for a specified school, or all of them.
	 * @param {Object} params feathers params object
	 */
	async find(params) {
		const query = this.injectPaginationQuery(params.query, this.options);

		let { schoolId } = query;
		if (params.account) {
			({ schoolId } = await this.app.service('users').get(params.account.userId));
		}
		const filter = {};
		if (schoolId) filter.schoolId = schoolId;
		if (query.datasourceId) filter.datasourceId = query.datasourceId;

		const result = await datasourceRunModel.find(
			filter,
			'datasourceId _id status dryrun duration',
		).sort(query.sort).skip(query.$skip).limit(query.$limit);

		return this.paginationLikeFormat(result, query);
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
			? await this.app.service('sync').create({ data: data.data }, { logStream, query: params.datasource.config })
			: await this.app.service('sync').find({ logStream, query: params.datasource.config });
		const endTime = Date.now();

		// determine status
		// ToDo: status into constants
		let status = SUCCESS;
		result.forEach((e) => {
			if (!e.success) status = ERROR;
		});

		// save to database
		const dsrData = {
			datasourceId: data.datasourceId,
			status,
			log: logString,
			config: params.datasource.config,
			schoolId: params.datasource.schoolId,
			dryrun: data.dryrun || false,
			createdBy: (params.account || {}).userId,
			duration: endTime - startTime,
		};
		const modelResult = await datasourceRunModel.create(dsrData);
		return Promise.resolve(modelResult);
	}
}

const datasourceRunService = new DatasourceRuns({
	paginate: {
		default: 50,
		max: 500,
	},
});

const datasourceRunsHooks = {
	before: {
		all: [
			authenticate('jwt'),
		],
		find: [
			iff(isProvider('external'), hasPermission('DATASOURCES_RUN_VIEW')),
		],
		get: [
			iff(isProvider('external'), hasPermission('DATASOURCES_RUN_VIEW')),
		],
		create: [
			iff(isProvider('external'), [
				validateSchema(datasourceRunCreateSchema, Ajv),
				hasPermission('DATASOURCES_RUN'),
			]),
			getDatasource,
			iff(isProvider('external'), restrictToDatasourceSchool),
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

module.exports = { datasourceRunService, datasourceRunsHooks };
