const globals = {
	BODYPARSER_JSON_LIMIT: process.env.BODYPARSER_JSON_LIMIT || '20mb',
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	DOCUMENT_BASE_DIR: process.env.DOCUMENT_BASE_DIR || 'https://s3.hidrive.strato.com/schul-cloud-hpi/',
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE: (5 * 1024 * 1024), // 5MB
	REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT || 8000,
	METRICS_PATH: process.env.METRICS_PATH || '/metrics',
	MONGOOSE_CONNECTION_POOL_SIZE: parseInt(process.env.MONGOOSE_CONNECTION_POOL_SIZE || '10', 10),
	STUDENT_TEAM_CREATE_DISABLED: process.env.STUDENT_TEAM_CREATE_DISABLED,
	SC_DOMAIN: process.env.SC_DOMAIN || 'localhost',
	SC_THEME: process.env.SC_THEME || 'default',
	SMTP_SENDER: process.env.SMTP_SENDER || 'noreply@schul-cloud.org',
	KEEP_ALIVE: process.env.KEEP_ALIVE || false,
	NODE_ENV: process.env.NODE_ENV || 'development', // default equals app.get('env')
	HOST: process.env.HOST || 'localhost:3030',
	TOKEN_SUB: process.env.TOKEN_SUB
	|| process.env.HOST || 'https://schulcloud-thueringen.de', // added TOKEN_SUB on env
	TOKEN_ISS: process.env.TOKEN_ISS || process.env.SC_DOMAIN || 'schulcloud-thueringen.de', // added TOKEN_ISS on env
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
};

module.exports = globals;
