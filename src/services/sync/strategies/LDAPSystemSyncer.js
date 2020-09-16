const Syncer = require('./Syncer');
const LDAPSyncer = require('./LDAPSyncer');

/**
 * Implements syncing from multiple LDAP servers based on the Syncer interface
 * @class LDAPSystemSyncer
 * @implements {Syncer}
 */
class LDAPSystemSyncer extends Syncer {
	constructor(app, stats, logger) {
		super(app, stats, logger);
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

	static params() {
		return [true];
	}

	/**
     * @see {Syncer#steps}
     */
	async steps() {
		await super.steps();
		const systems = await this.getSystems();
		for (const system of systems) {
			const stats = await new LDAPSyncer(this.app, {}, this.logger, system).sync();
			if (stats.success !== true) {
				this.stats.errors.push(`LDAP sync failed for system "${system.alias}" (${system._id}).`);
			}
			this.stats.systems[system.alias] = stats;

			// don't let unbind errors stop the sync
			this.app.service('ldap').disconnect(system.ldapConfig)
				.catch((error) => this.logger.error('Could not unbind from LDAP server', { error }));
		}
		return this.stats;
	}

	getSystems() {
		return this.app.service('systems').find({ query: { type: 'ldap', 'ldapConfig.active': true }, paginate: false })
			.then((systems) => {
				this.logInfo(`Found ${systems.length} LDAP configurations.`);
				return systems;
			});
	}
}

module.exports = LDAPSystemSyncer;
