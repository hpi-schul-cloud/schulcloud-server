const errors = require('@feathersjs/errors');
const auth = require('@feathersjs/authentication');
const logger = require('../../logger');

const Syncer = require('./strategies/Syncer');
const LDAPSystemSyncer = require('./strategies/LDAPSystemSyncer');
const CSVSyncer = require('./strategies/CSVSyncer');
const WebUntisSchoolyearSyncer = require('./strategies/WebUntisSchoolyearSyncer');

const syncers = [LDAPSystemSyncer, CSVSyncer, WebUntisSchoolyearSyncer];

module.exports = function syncServiceSetup() {
	const app = this;

	class SyncService {
		/**
		 * Constructor
		 *
		 * Disabled because of ESlint
		 */
		/* constructor() {} */

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
			syncers.forEach((SyncerClass) => {
				if (SyncerClass.respondsTo(target)) {
					const args = SyncerClass.params(params, data);
					if (args) {
						instances.push(new SyncerClass(app, {}, ...args));
					} else {
						throw new Error(`Invalid params for ${SyncerClass.name}: "${JSON.stringify(params)}"`);
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
				auth.hooks.authenticate('jwt'),
			],
		},
	});
};
