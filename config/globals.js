module.exports = {
	BODYPARSER_JSON_LIMIT: process.env.BODYPARSER_JSON_LIMIT || '20mb',
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	DOCUMENT_BASE_DIR: process.env.DOCUMENT_BASE_DIR || 'https://s3.hidrive.strato.com/schul-cloud-hpi/',
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE: (5 * 1024 * 1024), // 5MB
	REQUEST_TIMEOUT: 8000,
	STUDENT_TEAM_CREATE_DISABLED: process.env.STUDENT_TEAM_CREATE_DISABLED,
	SC_THEME: process.env.SC_THEME || 'default',
	SMTP_SENDER: process.env.SMTP_SENDER || 'noreply@schul-cloud.org',
	METRICS_PATH: process.env.METRICS_PATH || '/metrics',
};
