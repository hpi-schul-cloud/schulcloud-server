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
	'ALERT_STATUS_URL',
	'FEATURE_ES_COLLECTIONS_ENABLED',
	'FEATURE_EXTENSIONS_ENABLED',
	'FEATURE_TEAMS_ENABLED',
	'FEATURE_LERNSTORE_ENABLED',
	'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED',
	'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE',
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
	'SC_THEME',
	'SC_TITLE',
	'SC_SHORT_TITLE',
	'FEATURE_COURSE_SHARE',
	'FEATURE_COURSE_SHARE_NEW',
	'FEATURE_LOGIN_LINK_ENABLED',
	'FEATURE_LESSON_SHARE',
	'FEATURE_TASK_SHARE',
	'FEATURE_USER_MIGRATION_ENABLED',
	'FEATURE_COPY_SERVICE_ENABLED',
	'ACCESSIBILITY_REPORT_EMAIL',
	'GHOST_BASE_URL',
	'FEATURE_CONSENT_NECESSARY',
	'FEATURE_IMSCC_COURSE_EXPORT_ENABLED',
	'FEATURE_TASK_CARD_ENABLED',
	'FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED',
	'FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED',
	'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED',
	'MIGRATION_END_GRACE_PERIOD_MS',
	'FEATURE_CLIENT_USER_LOGIN_MIGRATION_ENABLED',
	'FEATURE_CTL_TOOLS_TAB_ENABLED',
	'FEATURE_LTI_TOOLS_TAB_ENABLED',
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
