const bbb = require('bbb-promise');
const { isUrl } = require('./utils');

const { HOST, SALT } = require('../../../../config/globals').SERVICES.VIDEOCONFERENCE;
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../../config/globals');

// validate host and salt if enabled
if (FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	// host must be valid uri that does not end with an slash
	if (!isUrl(HOST) || HOST.endsWith('/')) {
		throw new Error('VIDEOCONFERENCE.HOST must be valid uri that does not end with a slash');
	}
	if (typeof SALT !== 'string' || SALT === '') {
		throw new Error('VIDEOCONFERENCE.SALT must be a not empty string');
	}
}

const server = bbb.server(HOST, SALT);

module.exports = server;
