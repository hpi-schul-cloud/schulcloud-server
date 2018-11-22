const errors = require('feathers-errors');
const Syncer = require('./Syncer');

/**
 * A Syncer subclass that works on a given login system
 * @class SystemSyncer
 * @implements {Syncer}
 */
class SystemSyncer extends Syncer {

	constructor(app, system) {
		super(app);
		this.system = system;
	}

	prefix() {
		return this.system.alias;
	}
}

module.exports = SystemSyncer;
