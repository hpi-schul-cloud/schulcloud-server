const { Configuration } = require('@hpi-schul-cloud/commons');

/**
 * Should not open for external request only for SC internal micro services.
 */
const configServiceHooksV2 = {
	before: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

/**
 * This service resolve configuration for extern services for example shd.
 */
class ConfigServiceV2 {
	setup(app) {
		this.app = app;
	}

	find() {
		// secrets are save
		const _envs = {
			ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN'),
			SOME_OTHER_ENV_VARIABLES: 'string_value',
			SOME_ANY_OTHER_ENV_VARIABLES: true,
		};
		return _envs;
	}
}

module.exports = {
	configServiceHooksV2,
	ConfigServiceV2,
};
