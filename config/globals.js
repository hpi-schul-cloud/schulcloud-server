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
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	DB_URL: process.env.DB_URL || defaultDbUrl,
	DB_USERNAME: process.env.DB_USERNAME,
	DB_PASSWORD: process.env.DB_PASSWORD,
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE: 5 * 1024 * 1024, // 5MB
	MONGOOSE_CONNECTION_POOL_SIZE: parseInt(process.env.MONGOOSE_CONNECTION_POOL_SIZE || '10', 10),

	SC_DOMAIN: process.env.SC_DOMAIN || 'localhost',
	SC_THEME: process.env.SC_THEME || 'default',
	SC_TITLE: process.env.SC_TITLE || 'HPI Schul-Cloud',
	SC_SHORT_TITLE: process.env.SC_SHORT_TITLE || 'HPI Schul-Cloud',
	SMTP_SENDER: process.env.SMTP_SENDER || 'noreply@hpi-schul-cloud.org',

	LEAD_TIME: process.env.LEAD_TIME ? parseInt(process.env.LEAD_TIME, 10) : undefined,
	/**
	 * default value 'development' matches default of app.get('env'), but use globals
	 */
	NODE_ENV,
	ENVIRONMENTS,
	LOG_LEVEL: process.env.LOG_LEVEL || defaultLogLevel,
	SYSTEM_LOG_LEVEL: process.env.SYSTEM_LOG_LEVEL || 'sendRequests',
	// secrets smtp
	SMTP: process.env.SMTP,
	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	// secrets aws
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_REGION: process.env.AWS_REGION || 'eu-de',
	AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
	AUTHENTICATION: process.env.AUTHENTICATION,
	//
	DISPLAY_REQUEST_LEVEL: Number(process.env.DISPLAY_REQUEST_LEVEL || 0),
	ANALYTICS_LOGGING: process.env.ANALYTICS_LOGGING,
	LOGIN_BLOCK_TIME: process.env.LOGIN_BLOCK_TIME || 15, // allowedTimeDifference
	CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS: parseInt(process.env.CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS || 16, 10),

	/** used in tests only currently */
	OAUTH_URL: process.env.OAUTH_URL,

	// test user helper
	TEST_PW: (process.env.TEST_PW || '').trim(),
	TEST_HASH: (process.env.TEST_HASH || '').trim(),

	// files
	FILE_PREVIEW_SERVICE_URI: process.env.FILE_PREVIEW_SERVICE_URI || 'http://localhost:3000/filepreview',
	FILE_PREVIEW_CALLBACK_URI: process.env.FILE_PREVIEW_CALLBACK_URI || 'http://localhost:3030/fileStorage/thumbnail/',
	ENABLE_THUMBNAIL_GENERATION: process.env.ENABLE_THUMBNAIL_GENERATION || false,
	/** path must start and end with a slash */
	SECURITY_CHECK_SERVICE_PATH: '/fileStorage/securityCheck/',
	FILE_SECURITY_CHECK_MAX_FILE_SIZE:
		parseInt(process.env.FILE_SECURITY_CHECK_MAX_FILE_SIZE || '', 10) || 512 * 1024 * 1024,
	// rocketchat (here are no defaults defined)
	ROCKET_CHAT_URI: process.env.ROCKET_CHAT_URI,
	ROCKET_CHAT_ADMIN_TOKEN: process.env.ROCKET_CHAT_ADMIN_TOKEN,
	ROCKET_CHAT_ADMIN_ID: process.env.ROCKET_CHAT_ADMIN_ID,

	// etherpad
	ETHERPAD_API_KEY: process.env.ETHERPAD_API_KEY,
	ETHERPAD_API_PATH: process.env.ETHERPAD_API_PATH,
	ETHERPAD_URI: process.env.ETHERPAD_URI,
	ETHERPAD_OLD_PAD_URI: process.env.ETHERPAD_OLD_PAD_URI,
	ETHERPAD_OLD_PAD_DOMAIN: process.env.ETHERPAD_OLD_PAD_DOMAIN,
	ETHERPAD_COOKIE__EXPIRES_SECONDS: process.env.ETHERPAD_COOKIE__EXPIRES_SECONDS,
	ETHERPAD_ETHERPAD_COOKIE_RELEASE_THRESHOLD: process.env.ETHERPAD_COOKIE_RELEASE_THRESHOLD,
};

// validation /////////////////////////////////////////////////
const ENVIRONMENT_VALUES = Object.values(ENVIRONMENTS);
if (!ENVIRONMENT_VALUES.includes(globals.NODE_ENV)) {
	throw new Error('NODE_ENV must match one of valid environments', { ENVIRONMENT_VALUES, NODE_ENV });
}

module.exports = globals;
