const getSyncLogger = require('../logger');
const LDAPSystemSyncer = require('./LDAPSystemSyncer');

/**
 * Standalone LDAP sync runner that can be called from NestJS console applications.
 * This encapsulates all the Feathers-specific logic (strategies, logger creation)
 * so that external callers don't need to know about internal implementation details.
 *
 * @param {Object} app - The Feathers application instance
 * @param {Object} options - Sync options
 * @param {boolean} options.forceFullSync - Whether to force a full sync
 * @returns {Promise<Object>} Sync statistics
 */
async function runLegacyLdapSync(app, options = {}) {
	const { forceFullSync = false } = options;

	// Create the sync logger (Winston-based)
	const logger = getSyncLogger();

	// Create and run the LDAP system syncer
	const syncer = new LDAPSystemSyncer(app, {}, logger, { forceFullSync });
	const stats = await syncer.sync();

	return stats;
}

module.exports = { runLegacyLdapSync };
