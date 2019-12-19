const bbb = require('bbb-promise');
const { isUrl, isNullOrEmpty } = require('./utils');

const { HOST, SALT } = require('../../../../config/globals').SERVICES.VIDEOCONFERENCE;
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../../config/globals');

// validate host and salt if enabled
if (FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	// host must be valid uri that does not end with an slash
	if (!isUrl(HOST) || HOST.endsWith('/')) {
		throw new Error('VIDEOCONFERENCE.HOST must be valid uri that does not end with an slash');
	}
	if (isNullOrEmpty(SALT)) {
		throw new Error('VIDEOCONFERENCE.SALT must be a not emty string');
	}
}

const server = bbb.server(HOST, SALT);

module.exports = server;
