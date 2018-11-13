const errors = require('feathers-errors');

const AbstractSyncStrategy = require('./interface.js');

class LdapSyncStrategy extends AbstractSyncStrategy {
	constructor(app) {
		super();
		this.app = app;
	}

	executeSync() {
        return Promise.resolve(true);
    }
}

module.exports = LdapSyncStrategy;