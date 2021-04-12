const bbb = require('bbb-promise');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { isUrl } = require('./utils');

const FEATURE_VIDEOCONFERENCE_ENABLED = Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED');
const HOST = Configuration.get('VIDEOCONFERENCE_HOST');
const SALT = Configuration.get('VIDEOCONFERENCE_SALT');

// validate host and salt if enabled
if (FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	// host must be valid uri that does not end with an slash
	if (!isUrl(HOST) || HOST.endsWith('/')) {
		throw new Error('VIDEOCONFERENCE_HOST must be valid uri that does not end with a slash');
	}
	if (typeof SALT !== 'string' || SALT === '') {
		throw new Error('VIDEOCONFERENCE_SALT must be a not empty string');
	}
}

const server = bbb.server(HOST, SALT);

module.exports = server;
