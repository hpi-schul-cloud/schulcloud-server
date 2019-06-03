const errors = require('feathers-errors');
const logger = require('winston');
const auth = require('feathers-authentication');

const Syncer = require('./strategies/Syncer');
const LDAPSystemSyncer = require('./strategies/LDAPSystemSyncer');
const CSVSyncer = require('./strategies/CSVSyncer');

const syncers = [LDAPSystemSyncer, CSVSyncer];

module.exports = function () {
	const app = this;

	class SyncService {
		constructor() {}

		find(params) {
			return this.respond(null, params);
		}

		create(data, params) {
			return this.respond(data, params);
		}

		async respond(data, params) {
			if (!params.query || !params.query.target) {
				throw new errors.BadRequest('No target supplied');
			}
			const { target } = params.query;
			const instances = [];
			syncers.forEach((syncer) => {
				if (syncer.respondsTo(target)) {
					const args = syncer.params(params, data);
					if (args) {
						instances.push(new syncer(app, {}, ...args));
					} else {
						throw new Error(`Invalid params for ${syncer.name}: "${JSON.stringify(params)}"`);
					}
				}
			});
			if (instances.length === 0) {
				throw new Error(`No syncer responds to target "${target}"`);
			} else {
				const stats = await Promise.all(instances.map(instance => instance.sync()));
				const aggregated = Syncer.aggregateStats(stats);
				logger.info(`Sync finished. Successful: ${aggregated.successful}, Errors: ${aggregated.failed}`);
				return Promise.resolve(stats);
			}
		}
	}

	app.use('/sync', new SyncService());

	const syncService = app.service('/sync');
	syncService.before({
		create: [
			auth.hooks.authenticate('jwt'),
		],
	});
};
