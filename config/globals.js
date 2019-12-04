module.exports = {
	SC_THEME: process.env.SC_THEME || 'default',
	DOCUMENT_BASE_DIR: process.env.DOCUMENT_BASE_DIR || 'https://s3.hidrive.strato.com/schul-cloud-hpi/',
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	BODYPARSER_JSON_LIMIT: process.env.BODYPARSER_JSON_LIMIT || '20mb',
};
