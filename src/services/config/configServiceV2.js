const { Configuration } = require('@hpi-schul-cloud/commons');

/**
 *
 */
const configServiceHooksV2 = {
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
class ConfigServiceV2 {
	setup(app) {
		this.app = app;
	}

	find() {
		const envs = {
			ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN'),
		};

		return Promise.resolve(envs);
	}
}

module.exports = {
	configServiceHooksV2,
	ConfigServiceV2,
};
