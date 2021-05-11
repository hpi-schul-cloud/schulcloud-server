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

const exposedVars = [
	'ADMIN_TABLES_DISPLAY_CONSENT_COLUMN',
	'DOCUMENT_BASE_DIR',
	'FEATURE_ES_COLLECTIONS_ENABLED',
	'FEATURE_EXTENSIONS_ENABLED',
	'FEATURE_TEAMS_ENABLED',
	'JWT_SHOW_TIMEOUT_WARNING_SECONDS',
	'JWT_TIMEOUT_SECONDS',
	'NOT_AUTHENTICATED_REDIRECT_URL',
];

/**
 * This service for the env variables to sync between server and client.
 * These env variables must be public and there must be no secret values.
 */
class PublicAppConfigService {
	setup(app) {
		this.app = app;
	}

	find() {
		const envs = {};
		exposedVars.forEach((varName) => {
			envs[varName] = Configuration.get(varName);
		});

		return Promise.resolve(envs);
	}
}

module.exports = {
	publicAppConfigServiceHooks,
	PublicAppConfigService,
};
