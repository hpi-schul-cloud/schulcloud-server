/* eslint-disable no-process-env */

const ENVIRONMENTS = {
	DEVELOPMENT: 'development',
	TEST: 'test',
	PRODUCTION: 'production',
	MIGRATION: 'migration',
};

const { NODE_ENV = ENVIRONMENTS.DEVELOPMENT } = process.env;

let defaultLogLevel = null;
switch (NODE_ENV) {
	case ENVIRONMENTS.PRODUCTION:
		defaultLogLevel = 'error'; // level 3
		break;
	case ENVIRONMENTS.TEST:
		defaultLogLevel = 'emerg'; // level 0
		break;
	case ENVIRONMENTS.DEVELOPMENT:
	case ENVIRONMENTS.MIGRATION:
	default:
		defaultLogLevel = 'debug'; // level 7
}

let defaultDbUrl = null;
switch (NODE_ENV) {
	case ENVIRONMENTS.TEST:
		defaultDbUrl = 'mongodb://127.0.0.1:27017/schulcloud-test';
		break;
	default:
		defaultDbUrl = 'mongodb://127.0.0.1:27017/schulcloud';
}

const globals = {
	BODYPARSER_JSON_LIMIT: process.env.BODYPARSER_JSON_LIMIT || '20mb',
	DB_URL: process.env.DB_URL || defaultDbUrl,
	DB_USERNAME: process.env.DB_USERNAME,
	DB_PASSWORD: process.env.DB_PASSWORD,
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE: 5 * 1024 * 1024, // 5MB
	MONGOOSE_CONNECTION_POOL_SIZE: parseInt(process.env.MONGOOSE_CONNECTION_POOL_SIZE || '10', 10),

	SC_DOMAIN: process.env.SC_DOMAIN || 'localhost',
	SC_THEME: process.env.SC_THEME || 'default',
	SC_TITLE: process.env.SC_TITLE || 'HPI Schul-Cloud',
	SMTP_SENDER: process.env.SMTP_SENDER || 'noreply@dbildungscloud.de',

	LEAD_TIME: process.env.LEAD_TIME ? parseInt(process.env.LEAD_TIME, 10) : undefined,
	/**
	 * default value 'development' matches default of app.get('env'), but use globals
	 */
	NODE_ENV,
	ENVIRONMENTS,
	LOG_LEVEL: process.env.LOG_LEVEL || defaultLogLevel,
	SYSTEM_LOG_LEVEL: process.env.SYSTEM_LOG_LEVEL || 'sendRequests',
	API_HOST: process.env.API_HOST,
	// secrets aws
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_REGION: process.env.AWS_REGION || 'eu-de',
	AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,

	//
	DISPLAY_REQUEST_LEVEL: Number(process.env.DISPLAY_REQUEST_LEVEL || 0),
	ANALYTICS_LOGGING: process.env.ANALYTICS_LOGGING,
	CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS: parseInt(process.env.CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS || 16, 10),

	/** used in tests only currently */
	OAUTH_URL: process.env.OAUTH_URL,

	// test user helper
	TEST_PW: (process.env.TEST_PW || '').trim(),
	TEST_HASH: (process.env.TEST_HASH || '').trim(),

	/** path must start and end with a slash */
	SECURITY_CHECK_SERVICE_PATH: '/v1/fileStorage/securityCheck/',
	FILE_SECURITY_CHECK_MAX_FILE_SIZE:
		parseInt(process.env.FILE_SECURITY_CHECK_MAX_FILE_SIZE || '', 10) || 512 * 1024 * 1024,
	// rocketchat (here are no defaults defined)
	ROCKET_CHAT_URI: process.env.ROCKET_CHAT_URI,
	ROCKET_CHAT_ADMIN_TOKEN: process.env.ROCKET_CHAT_ADMIN_TOKEN,
	ROCKET_CHAT_ADMIN_ID: process.env.ROCKET_CHAT_ADMIN_ID,
	ROCKET_CHAT_ADMIN_USER: process.env.ROCKET_CHAT_ADMIN_ID,
	ROCKET_CHAT_ADMIN_PASSWORD: process.env.ROCKET_CHAT_ADMIN_ID,

	// nextcloud
	NEXTCLOUD_BASE_URL: process.env.NEXTCLOUD_BASE_URL,
	NEXTCLOUD_ADMIN_USER: process.env.NEXTCLOUD_ADMIN_USER,
	NEXTCLOUD_ADMIN_PASS: process.env.NEXTCLOUD_ADMIN_PASS,
	NEXTCLOUD_SCOPES: process.env.NEXTCLOUD_SCOPES,

	// calendar
	CALENDAR_URI: process.env.CALENDAR_URI,
};

// validation /////////////////////////////////////////////////
const ENVIRONMENT_VALUES = Object.values(ENVIRONMENTS);
if (!ENVIRONMENT_VALUES.includes(globals.NODE_ENV)) {
	throw new Error('NODE_ENV must match one of valid environments', { ENVIRONMENT_VALUES, NODE_ENV });
}

module.exports = globals;
