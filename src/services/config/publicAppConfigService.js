const { Configuration } = require('@hpi-schul-cloud/commons');

const publicAppConfigServiceHooks = {
	before: {
		all: [],
		find: [],
	},
	after: {
		all: [],
		find: [],
	},
};

const exposedVars = [
	'ADMIN_TABLES_DISPLAY_CONSENT_COLUMN',
	'FEATURE_ES_COLLECTIONS_ENABLED',
	'FEATURE_EXTENSIONS_ENABLED',
	'FEATURE_TEAMS_ENABLED',
	'JWT_SHOW_TIMEOUT_WARNING_SECONDS',
	'JWT_TIMEOUT_SECONDS',
	'NOT_AUTHENTICATED_REDIRECT_URL',
	'DOCUMENT_BASE_DIR',
	'SC_THEME',
	'SC_TITLE',
	'SC_SHORT_TITLE',
];

/**
 * This service is for the env variables to sync between server and client.
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
	exposedVars,
	publicAppConfigServiceHooks,
	PublicAppConfigService,
};
