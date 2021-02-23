const asyncPool = require('tiny-async-pool');
const { Configuration } = require('@hpi-schul-cloud/commons');
const Syncer = require('./Syncer');
const LDAPSyncer = require('./LDAPSyncer');

/**
 * Implements syncing from multiple LDAP servers based on the Syncer interface
 * @class LDAPSystemSyncer
 * @implements {Syncer}
 */
class LDAPSystemSyncer extends Syncer {
	constructor(app, stats, logger, options = {}) {
		super(app, stats, logger);
		this.options = options;
		Object.assign(this.stats, {
			systems: {},
		});
	}

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'ldap';
	}

	static params(params, data = {}) {
		const forceFullSync = params.query.forceFullSync === 'true' || data.forceFullSync || false;
		return [
			{
				forceFullSync,
			},
		];
	}

	/**
	 * @see {Syncer#steps}
	 */
	async steps() {
		await super.steps();
		const systems = await this.getSystems();
		const nextSystemSync = async (system) => {
			try {
				const stats = await new LDAPSyncer(this.app, {}, this.logger, system, this.options).sync();
				if (stats.success !== true) {
					this.stats.errors.push(`LDAP sync failed for system "${system.alias}" (${system._id}).`);
				}
				this.stats.systems[system.alias] = stats;
			} catch (err) {
				// We need to catch errors here, so that the async pool will not reject early without
				// running all sync processes
				this.logger.error('Uncaught LDAP sync error', { error: err, systemId: system._id });
				this.stats.errors.push(
					`LDAP sync failed for system "${system.alias}" (${system._id}) with error "${err.message}".`
				);
			} finally {
				// don't let unbind errors stop the sync
				this.app
					.service('ldap')
					.disconnect(system.ldapConfig)
					.catch((error) => this.logger.error('Could not unbind from LDAP server', { error }));
			}
		};
		const poolSize = Configuration.get('LDAP_SYSTEM_SYNCER_POOL_SIZE');
		this.logger.info(`Running LDAP system sync with pool size ${poolSize}`);
		await asyncPool(poolSize, systems, nextSystemSync);
		return this.stats;
	}

	getSystems() {
		return this.app
			.service('systems')
			.find({ query: { type: 'ldap', 'ldapConfig.active': true }, paginate: false })
			.then((systems) => {
				this.logInfo(`Found ${systems.length} LDAP configurations.`);
				return systems;
			});
	}
}

module.exports = LDAPSystemSyncer;
