/* eslint-disable no-process-env */

const { Configuration } = require('@hpi-schul-cloud/commons');
const ENVIRONMENTS = {
	DEVELOPMENT: 'development',
	TEST: 'test',
	PRODUCTION: 'production',
	MIGRATION: 'migration',
};

const { NODE_ENV = ENVIRONMENTS.DEVELOPMENT } = process.env;

const globals = {
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE: 5 * 1024 * 1024, // 5MB

	SC_THEME: Configuration.get('SC_THEME'),
	SC_TITLE: Configuration.get('SC_TITLE'),
	SMTP_SENDER: Configuration.get('SMTP_SENDER'),

	LEAD_TIME: process.env.LEAD_TIME ? parseInt(process.env.LEAD_TIME, 10) : undefined,
	/**
	 * default value 'development' matches default of app.get('env'), but use globals
	 */
	NODE_ENV,
	ENVIRONMENTS,
	LOG_LEVEL: Configuration.get('LOG_LEVEL'),
	// secrets aws
	// are you sure about that? access key = secret key?
	// not used anyway, only used when FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED = false
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_REGION: process.env.AWS_REGION || 'eu-de',
	AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,

	//
	DISPLAY_REQUEST_LEVEL: Number(process.env.DISPLAY_REQUEST_LEVEL || 0),
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
};

// validation /////////////////////////////////////////////////
const ENVIRONMENT_VALUES = Object.values(ENVIRONMENTS);
if (!ENVIRONMENT_VALUES.includes(globals.NODE_ENV)) {
	throw new Error('NODE_ENV must match one of valid environments', { ENVIRONMENT_VALUES, NODE_ENV });
}

module.exports = globals;
