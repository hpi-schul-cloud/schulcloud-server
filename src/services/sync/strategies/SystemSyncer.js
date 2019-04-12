const errors = require('@feathersjs/errors');
const Syncer = require('./Syncer');

/**
 * A Syncer subclass that works on a given login system
 * @class SystemSyncer
 * @implements {Syncer}
 */
class SystemSyncer extends Syncer {

	constructor(app, stats, system) {
		super(app, stats);
		this.system = system;
	}

	static getSystems(app, type) {
		return app.service('systems').find({
			query: { type }
		}).then(systems => systems.data);
	}

	prefix() {
		return this.system.alias;
	}
}

module.exports = SystemSyncer;
