const { Configuration } = require('@schul-cloud/commons');
const { isUrl } = require('./utils');
const bbb = require('./bbb');

const FEATURE_VIDEOCONFERENCE_ENABLED = Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED');
const HOST = Configuration.get('VIDEOCONFERENCE_HOST');
const SALT = Configuration.get('VIDEOCONFERENCE_SALT');

if (FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	if (!isUrl(HOST) || HOST.endsWith('/')) {
		throw new Error('VIDEOCONFERENCE_HOST must be valid uri that does not end with a slash');
	}
	if (typeof SALT !== 'string' || SALT === '') {
		throw new Error('VIDEOCONFERENCE_SALT must be a not empty string');
	}
}

module.exports = bbb(HOST, SALT);
