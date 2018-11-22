const errors = require('feathers-errors');
const logger = require('winston');

const Syncer = require('./strategies/Syncer');
const LDAPSystemSyncer = require('./strategies/LDAPSystemSyncer');
const CSVSyncer = require('./strategies/CSVSyncer');

const syncers = [LDAPSystemSyncer, CSVSyncer];

module.exports = function () {

	const app = this;

	class SyncService {
		constructor() {}

		find(params) {
			const target = params.query.target;
			const instances = [];
			syncers.forEach(syncer => {
				if (syncer.respondsTo(target)) {
					const args = syncer.params(params.query);
					if (args) {
						instances.push(new syncer(app, {}, ...args));
					} else {
						throw new Error(`Invalid params for ${syncer.constructor.name}: "${JSON.stringify(params)}"`);
					}
				}
			});
			if (instances.length === 0) {
				throw new Error(`No syncer responds to target "${target}"`);
			} else {
				return Promise.all(instances.map(instance => instance.sync()))
				.then((stats) => {
					const aggregated = Syncer.aggregateStats(stats);
					logger.info(`Sync finished. Successful: ${aggregated.successful}, Errors: ${aggregated.failed}`);
					return Promise.resolve(stats);
				});
			}
		}
	}

	app.use('/sync', new SyncService());
};
