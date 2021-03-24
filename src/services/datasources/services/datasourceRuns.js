const Ajv = require('ajv');
const { Writable } = require('stream');

const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, validateSchema, disallow } = require('feathers-hooks-common');
const { Forbidden, GeneralError } = require('../../../errors');
const { hasPermission } = require('../../../hooks');
const { getDatasource, restrictToDatasourceSchool } = require('../hooks');
// const { datasourcesDocs } = require('../docs');

const { datasourceRunCreateSchema } = require('../schemas');
const { datasourceRunModel } = require('../model');
const { SUCCESS, ERROR, PENDING } = require('../constants');

class DatasourceRuns {
	constructor(options) {
		this.options = options || {};
	}

	registerEventListeners() {}

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
			const resultQuery = { $paginate: true, ...query };
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

		const result = await datasourceRunModel
			.find(filter, 'datasourceId _id status dryrun duration')
			.sort(query.sort)
			.skip(query.$skip)
			.limit(query.$limit);

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
	 * write a datasourceRun in pending state to the database
	 * @param {Object} datasource a datasource object
	 * @param {Bool} dryrun
	 * @param {ObjectId} userId id of the user calling the run.
	 */
	persistPendingRun(datasource, dryrun, userId) {
		const dsrData = {
			datasourceId: datasource._id,
			status: PENDING,
			config: datasource.config,
			schoolId: datasource.schoolId,
			dryrun,
			createdBy: userId,
		};
		return datasourceRunModel.create(dsrData);
	}

	/**
	 * Update both the datasource and the datasourcerun with the results of a successful Sync.
	 * @param {Object} result result of a syncer run
	 * @param {Sting} logString string containing the log of the syncer run
	 * @param {Date} startTime the time the sync has been started
	 * @param {ObjectId} datasourceRunId id of the datasourceRun associated with the syncer run
	 * @param {ObjectId} datasourceId id of the datasource
	 */
	async updateAfterSuccess(result, logString, startTime, datasourceRunId, datasourceId) {
		const endTime = Date.now();
		let status = SUCCESS;
		result.forEach((e) => {
			if (!e.success) status = ERROR;
		});

		// save to database
		const updateData = {
			status,
			log: logString,
			duration: endTime - startTime,
		};

		try {
			await Promise.all([
				datasourceRunModel.updateOne({ _id: datasourceRunId }, updateData),
				this.app.service('datasources').patch(datasourceId, {
					lastRun: endTime,
					lastStatus: status,
				}),
			]);
		} catch (err) {
			throw new GeneralError('error while updating datasourcerun', err);
		}
	}

	/**
	 * Update the datasource and datasourceRun with the results of a failed Sync
	 * @param {String} message error message
	 * @param {Date} startTime the time the sync has been started
	 * @param {ObjectId} datasourceRunId id of the datasourceRun associated with the syncer run
	 * @param {ObjectId} datasourceId id of the datasource
	 */
	async updateAfterFail(message, startTime, datasourceRunId, datasourceId) {
		const endTime = Date.now();
		const updateData = {
			status: ERROR,
			log: `Error while syncing: ${message}`,
			duration: endTime - startTime,
		};
		await Promise.all([
			datasourceRunModel.updateOne({ _id: datasourceRunId }, updateData),
			this.app.service('datasources').patch(datasourceId, {
				lastRun: endTime,
				lastStatus: ERROR,
			}),
		]);
	}

	/**
	 * Run a sync for a specific datasource, with its current config and passed data.
	 * The results and logs of the run get saved and can be reviewed later.
	 * @param {Object} data userdata, has to conform to the datasourceRuns.create.schema.json.
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		// set up stream for the sync log
		const dryrun = data.dryrun || false;

		const datasourceRun = await this.persistPendingRun(params.datasource, dryrun, (params.account || {}).userId);

		let logString = '';
		const logStream = new Writable({
			write(chunk, encoding, callback) {
				logString += chunk.toString();
				callback();
			},
		});

		const startTime = Date.now();
		const syncParams = {
			logStream,
			query: params.datasource.config,
			dryrun,
			datasourceId: params.datasource._id,
		};

		// we intentionally do not await the sync, and instead return the pending run.
		const promise = this.app.service('sync').create(data, syncParams);

		promise.then(async (result) => {
			await this.updateAfterSuccess(result, logString, startTime, datasourceRun._id, params.datasource._id);
		});
		promise.catch(async (err) => {
			await this.updateAfterFail(err.message, startTime, datasourceRun._id, params.datasource._id);
			throw new GeneralError(
				'datasourceRun encountered an error after invoking sync. This is most likely a user error.',
				err
			);
		});

		return Promise.resolve(datasourceRun);
	}
}

const datasourceRunService = new DatasourceRuns({
	paginate: {
		default: 50,
		max: 500,
	},
	multi: true,
	whitelist: ['$exists', '$elemMatch', '$regex', '$skip', '$populate'],
});

const datasourceRunsHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [iff(isProvider('external'), hasPermission('DATASOURCES_RUN_VIEW'))],
		get: [iff(isProvider('external'), hasPermission('DATASOURCES_RUN_VIEW'))],
		create: [
			iff(isProvider('external'), [validateSchema(datasourceRunCreateSchema, Ajv), hasPermission('DATASOURCES_RUN')]),
			getDatasource,
			iff(isProvider('external'), restrictToDatasourceSchool),
		],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
	},
};

module.exports = { datasourceRunService, datasourceRunsHooks };
