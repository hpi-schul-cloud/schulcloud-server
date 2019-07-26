const Syncer = require('./Syncer');

/**
 * Implements syncing from WebUntis API based on the Syncer interface
 * @class WebUntisSyncer
 * @implements {Syncer}
 */
class WebUntisSyncer extends Syncer {

	constructor(app, stats) {
		super(app, stats);
		Object.assign(this.stats, {
//			systems: {},
		});
	}

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'webuntis';
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
                                        // TODO: implement
					this.stats.systems[system.alias] = {};
					return new LDAPSyncer(this.app, this.stats.systems[system.alias], system).sync();
				}));
			});
	}

	async getFoo() {
		return { foo: 'bar' };
	}
}

module.exports = WebUntisSyncer;
