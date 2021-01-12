const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { BadRequest } = require('../../errors');

const { hasPermission } = require('../../hooks');

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
				throw new BadRequest('No target supplied');
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

	app.use('/sync/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/sync', new SyncService());

	const syncService = app.service('/sync');
	syncService.hooks({
		before: {
			all: [
				iff(isProvider('external'), [
					authenticate('jwt', 'api-key'),
					iff((context) => context.account, hasPermission('SYNC_START')),
				]),
			],
		},
	});
};
