const globals = {
	// secrets aws
	// are you sure about that? access key = secret key?
	// not used anyway, only used when FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED = false
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_REGION: process.env.AWS_REGION || 'eu-de',
	AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
	DISPLAY_REQUEST_LEVEL: Number(process.env.DISPLAY_REQUEST_LEVEL || 0),
	CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS: parseInt(process.env.CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS || 16, 10),
	/** path must start and end with a slash */
	SECURITY_CHECK_SERVICE_PATH: '/v1/fileStorage/securityCheck/',
	FILE_SECURITY_CHECK_MAX_FILE_SIZE:
		parseInt(process.env.FILE_SECURITY_CHECK_MAX_FILE_SIZE || '', 10) || 512 * 1024 * 1024,
};

module.exports = globals;
