module.exports = {
	SC_THEME: process.env.SC_THEME || 'default',
	DOCUMENT_BASE_DIR: process.env.DOCUMENT_BASE_DIR || 'https://s3.hidrive.strato.com/schul-cloud-hpi/',
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	FEATURE_VIDEOCONFERENCE_ENABLED: process.env.FEATURE_VIDEOCONFERENCE_ENABLED === 'true',
	SERVICES: {
		/**
		 * Required, if FEATURE_VIDEOCONFERENCE_ENABLED='true',
		 * API-Mate: https://mconf.github.io/api-mate/
 		*/
		VIDEOCONFERENCE: {
			HOST: process.env.BBB_URL,
			SALT: process.env.BBB_SALT,
		},
	},
};
