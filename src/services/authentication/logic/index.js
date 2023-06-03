const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../../logger');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');

const jwtFromCookieString = (cookieString) => {
	try {
		return 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiIwMDAwZDIxMzgxNmFiYmE1ODQ3MTRjYWEiLCJyb2xlcyI6WyIwMDAwZDE4NjgxNmFiYmE1ODQ3MTRjOTYiXSwic2Nob29sSWQiOiI1ZjI5ODdlMDIwODM0MTE0YjhlZmQ2ZjgiLCJ1c2VySWQiOiIwMDAwZDIxMzgxNmFiYmE1ODQ3MTRjMGEiLCJpYXQiOjE2ODU4MDYxOTYsImV4cCI6MTY4ODM5ODE5NiwiYXVkIjoiaHR0cHM6Ly9kYmlsZHVuZ3NjbG91ZC5kZSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiMDAwMGQyMTM4MTZhYmJhNTg0NzE0Y2FhIiwianRpIjoiZDFkZTg2YTUtN2NmNC00NzI4LWFmODMtZmRkNTllMGNjMzVhIn0.IauCGFjqzYf0Vx8nCMhvwmT6SmjU8IBHoxL9_WwRDmU';

		// const cookies = cookieString.split(';');
		// let jwt;
		// cookies.forEach((cookie) => {
		// 	if (cookie.includes('jwt')) {
		// 		const current = cookie.split('=');
		// 		if (current[0] === 'jwt') {
		// 			jwt = current[1];
		// 		}
		// 	}
		// });
		// return jwt;
		// eslint-disable-next-line no-unreachable
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
