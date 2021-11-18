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
	'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED',
	'FEATURE_ADMIN_TOGGLE_STUDENT_VISIBILITY_ENABLED',
	'FEATURE_SCHOOL_POLICY_ENABLED',
	'FEATURE_VIDEOCONFERENCE_ENABLED',
	'ROCKETCHAT_SERVICE_ENABLED',
	'LERNSTORE_MODE',
	'I18N__AVAILABLE_LANGUAGES',
	'I18N__DEFAULT_LANGUAGE',
	'I18N__DEFAULT_TIMEZONE',
	'I18N__FALLBACK_LANGUAGE',
	'JWT_SHOW_TIMEOUT_WARNING_SECONDS',
	'JWT_TIMEOUT_SECONDS',
	'NOT_AUTHENTICATED_REDIRECT_URL',
	'DOCUMENT_BASE_DIR',
	'FEATURE_MATRIX_MESSENGER_ENABLED',
	'MATRIX_MESSENGER__SCHOOL_SETTINGS_VISIBLE',
	'MATRIX_MESSENGER__STUDENT_ROOM_CREATION',
	'MATRIX_MESSENGER__SCHOOL_ROOM_ENABLED',
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
		// TODO: add true/false for getRedisClient() as check for this.$axios.$post("/accounts/jwtTimer");
		const envs = {};
		exposedVars.forEach((varName) => {
			if (Configuration.has(varName)) {
				envs[varName] = Configuration.get(varName);
			}
		});

		return Promise.resolve(envs);
	}
}

module.exports = {
	exposedVars,
	publicAppConfigServiceHooks,
	PublicAppConfigService,
};
