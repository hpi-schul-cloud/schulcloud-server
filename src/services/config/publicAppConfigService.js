const { Configuration } = require('@hpi-schul-cloud/commons');

/**
 *
 */
const publicAppConfigServiceHooks = {
	before: {
		all: [],
		find: [],
		// get: [],
		// create: [],
		// update: [],
		// patch: [],
		// remove: [],
	},
	after: {
		all: [],
		find: [],
		// get: [],
		// create: [],
		// update: [],
		// patch: [],
		// remove: [],
	},
};

/**
 * This service for the env variables to sync between server and client.
 * These env variables must be public and there must be no secret values.
 */
class PublicAppConfigService {
	setup(app) {
		this.app = app;
	}

	find() {
		const envs = {
			ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN'),
			JWT_SHOW_TIMEOUT_WARNING_SECONDS: Configuration.get('JWT_SHOW_TIMEOUT_WARNING_SECONDS'),
			JWT_TIMEOUT_SECONDS: Configuration.get('JWT_TIMEOUT_SECONDS'),
			FEATURE_EXTENSIONS_ENABLED: Configuration.get('FEATURE_EXTENSIONS_ENABLED'),
			FEATURE_TEAMS_ENABLED: Configuration.get('FEATURE_TEAMS_ENABLED'),
			NOT_AUTHENTICATED_REDIRECT_URL: Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL'),
			FEATURE_ES_COLLECTIONS_ENABLED: Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED'),
		};

		return Promise.resolve(envs);
	}
}

module.exports = {
	publicAppConfigServiceHooks,
	PublicAppConfigService,
};
