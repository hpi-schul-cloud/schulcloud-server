class AbstractSyncStrategy {

    /**
     * @abstract
     */
    constructor() {
		if (new.target === AbstractSyncStrategy) {
            throw new TypeError(`Cannot construct AbstractLDAPStrategy
                instances directly.`);
		}
    }

    /**
     * Implements the specific algorithm to synchronize with an external system providing data.
     * @abstract
     * @param app 
     * @returns {Promise} Promise that resolves when synchronisation is completed successfully
     */
    executeSync(app) {
        throw new TypeError('Method has to be implemented.');
    }


}

module.exports = AbstractSyncStrategy;