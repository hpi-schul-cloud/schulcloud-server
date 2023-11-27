const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../../logger');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');

const jwtFromCookieString = (cookieString) => {
	try {
		const cookies = cookieString.split(';');
		let jwt;
		cookies.forEach((cookie) => {
			if (cookie.includes('jwt')) {
				const current = cookie.split('=');
				if (current[0] === 'jwt') {
					jwt = current[1];
				}
			}
		});
		return jwt;
	} catch (e) {
		return undefined;
	}
};

const extractTokenFromBearerHeader = (header) => header.replace('Bearer ', '');

const authHeaderExtractor = (req) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return undefined;
	}
	return extractTokenFromBearerHeader(authHeader);
};

let secrets;
try {
	// todo resolve this somewhere else
	if (NODE_ENV === ENVIRONMENTS.PRODUCTION) {
		// eslint-disable-next-line global-require
		secrets = require('../../../../config/secrets.js');
	} else {
		// eslint-disable-next-line global-require
		secrets = require('../../../../config/secrets.json');
	}
} catch (error) {
	secrets = {};
}

const authenticationSecret = secrets.authentication ? secrets.authentication : 'secrets';
if (NODE_ENV === ENVIRONMENTS.PRODUCTION && !secrets.authentication) {
	logger.error('use default authentication secret');
}

const audience = Configuration.get('JWT_AUD');

module.exports = {
	jwtFromCookieString,
	extractTokenFromBearerHeader,
	authHeaderExtractor,
	authenticationSecret,
	audience,
	secrets,
};
