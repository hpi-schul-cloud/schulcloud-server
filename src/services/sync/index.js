const errors = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');

const Syncer = require('./strategies/Syncer');
const syncers = require('./strategies');
const getSyncLogger = require('./logger');

module.exports = function setup() {
	const app = this;

	class SyncService {
		find(params) {
			return this.respond(undefined, params);
		}

		create(data, params) {
			return this.respond(data, params);
		}

		async respond(data, params) {
			if (!params.query || !params.query.target) {
				throw new errors.BadRequest('No target supplied');
			}
			const { target } = params.query;
			const logger = getSyncLogger(params.logStream);
			const instances = [];
			syncers.forEach((StrategySyncer) => {
				if (StrategySyncer.respondsTo(target)) {
					const args = StrategySyncer.params(params, data);
					if (args) {
						instances.push(new StrategySyncer(app, {}, logger, ...args));
					} else {
						throw new Error(`Invalid params for ${StrategySyncer.name}: "${JSON.stringify(params)}"`);
					}
				}
			});
			if (instances.length === 0) {
				throw new Error(`No syncer responds to target "${target}"`);
			} else {
				const stats = await Promise.all(instances.map((instance) => instance.sync()));
				const aggregated = Syncer.aggregateStats(stats);
				logger.info(`Sync finished. Successful: ${aggregated.successful}, Errors: ${aggregated.failed}`);
				return Promise.resolve(stats);
			}
		}
	}

	app.use('/sync', new SyncService());

	const syncService = app.service('/sync');
	syncService.hooks({
		before: {
			create: [
				authenticate('jwt'),
			],
		},
	});
};
