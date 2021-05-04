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
			FALLBACK_DISABLED: true,
			JWT_SHOW_TIMEOUT_WARNING_SECONDS: 3600,
			JWT_TIMEOUT_SECONDS: 3600 * 2,
			FEATURE_EXTENSIONS_ENABLED: true,
			FEATURE_TEAMS_ENABLED: true,
			NOT_AUTHENTICATED_REDIRECT_URL: "/login",
			FEATURE_ES_COLLECTIONS_ENABLED: false,
		};

		return Promise.resolve(envs);
	}
}

module.exports = {
	publicAppConfigServiceHooks,
	PublicAppConfigService,
};
