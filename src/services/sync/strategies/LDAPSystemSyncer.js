const errors = require('@feathersjs/errors');
const Syncer = require('./Syncer');
const LDAPSyncer = require('./LDAPSyncer');

/**
 * Implements syncing from multiple LDAP servers based on the Syncer interface
 * @class LDAPSystemSyncer
 * @implements {Syncer}
 */
class LDAPSystemSyncer extends Syncer {

	constructor(app, stats) {
		super(app, stats);
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

	static params(params, data) {
		return [true];
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
		return super.steps()
			.then(() => this.getSystems())
			.then(systems => {
				return Promise.all(systems.map(system => {
					this.stats.systems[system.alias] = {};
					return new LDAPSyncer(this.app, this.stats.systems[system.alias], system).sync();
				}));
			});
	}

	getSystems() {
		return this.app.service('systems').find({ query: { type: 'ldap', 'ldapConfig.active': true }, paginate: false })
			.then(systems => {
				this.logInfo(`Found ${systems.length} LDAP configurations.`);
				return systems;
			});
	}
}

module.exports = LDAPSystemSyncer;
