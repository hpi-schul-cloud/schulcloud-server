const errors = require('feathers-errors');
const logger = require('winston');

const LDAPSyncer = require('./strategies/LDAPSyncer');

const syncers = {
	'ldap': LDAPSyncer,
};

const getSystems = (app, type) => {
	return app.service('systems').find({ query: { type } })
		.then(systems => {
			logger.info(`Found ${systems.total} ${type} configurations.`);
			return systems.data;
		});
};

const syncSystems = (app, type) => {
	logger.info(`Syncing ${type}`);
	return getSystems(app, type).then(systems => {
		return Promise.all(systems.map(system => {
			const syncer = new (syncers[type])(app, system);
			return syncer.sync();
		}));
	})
	.then((stats) => {
		const aggregated = stats.reduce((agg, cur) => {
			agg.successful += cur.successful;
			agg.failed += cur.failed;
			return agg;
		}, { successful: 0, failed: 0 });
		logger.info(`Sync finished. Successful system syncs: ${aggregated.successful}, Errors: ${aggregated.failed}`);
		return Promise.resolve(stats);
	});
};

module.exports = function () {

	const app = this;

	class SyncService {
		constructor() {}

		find(params) {
			return syncSystems(app, params.query.target);
		}
	}

	app.use('/sync', new SyncService());
};
