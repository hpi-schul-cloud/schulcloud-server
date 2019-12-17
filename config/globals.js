module.exports = {
	SC_THEME: process.env.SC_THEME || 'default',
	DOCUMENT_BASE_DIR: process.env.DOCUMENT_BASE_DIR || 'https://s3.hidrive.strato.com/schul-cloud-hpi/',
	DATABASE_AUDIT: process.env.DATABASE_AUDIT || 'false',
	FEATURE_VIDEOCONFERENCE_ENABLED: process.env.FEATURE_VIDEOCONFERENCE_ENABLED === 'true',
	SERVICES: {
		/**
		 * Requires FEATURE_VIDEOCONFERENCE_ENABLED=true, API-Mate: https://mconf.github.io/api-mate/#server=https://bigbluebutton.schul-cloud.org/bigbluebutton/&sharedSecret=nueUMgNqoypZIPp1EYQ122YzmhWTtanCIOiQYcrV4Q
 		*/
		VIDEOCONFERENCE: {
			URL: process.env.BBB_URL,
			SALT: process.env.BBB_SALT,
		},
	},
};
