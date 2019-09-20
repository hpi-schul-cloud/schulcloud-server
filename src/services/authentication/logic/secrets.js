const bcrypt = require('bcryptjs');
const logger = require('../../../logger');

const DEFAULT_AUTHENTICATION_SECRET = 'secret';
let secrets;
try {
	if (['production', 'lokal'].includes(process.env.NODE_ENV)) {
		// eslint-disable-next-line global-require
		secrets = require('../../../../config/secrets.js');
	} else {
		// eslint-disable-next-line global-require
		secrets = require('../../../../config/secrets.json');
	}
} catch (error) {
	secrets = {};
}

const authenticationSecret = (secrets.authentication) ? secrets.authentication : DEFAULT_AUTHENTICATION_SECRET;

if (authenticationSecret === DEFAULT_AUTHENTICATION_SECRET && process.env.NODE_ENV === 'production') {
	logger.warning('there is no custom authentication secret defined');
}

const hash = (value) => bcrypt.hashSync(value, authenticationSecret);

module.exports = { secrets, authenticationSecret, hash };
