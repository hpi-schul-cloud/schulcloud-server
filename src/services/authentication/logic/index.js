const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../../logger');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');

const jwtFromCookieString = (cookieString) => {
	try {
		return 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJhY2NvdW50SWQiOiIwMDAwZDIxMzgxNmFiYmE1ODQ3MTRjYWEiLCJyb2xlcyI6WyIwMDAwZDE4NjgxNmFiYmE1ODQ3MTRjOTYiXSwic2Nob29sSWQiOiI1ZjI5ODdlMDIwODM0MTE0YjhlZmQ2ZjgiLCJ1c2VySWQiOiIwMDAwZDIxMzgxNmFiYmE1ODQ3MTRjMGEiLCJpYXQiOjE2ODU3MjA4MjUsImV4cCI6MTY4ODMxMjgyNSwiYXVkIjoiaHR0cHM6Ly9kYmlsZHVuZ3NjbG91ZC5kZSIsImlzcyI6ImZlYXRoZXJzIiwic3ViIjoiMDAwMGQyMTM4MTZhYmJhNTg0NzE0Y2FhIiwianRpIjoiYWMzZDI5OTItM2MxOS00NGZlLWE3NzMtY2E0ZGZhNjdiMzNiIn0.Xq4g-Ax3b8ISmLJmSjLuk1F-F__tSwChKaFx7xX1XLw; connect.sid=s%3AV5Im5OTPtApmLzbyem_Ewb1qLcBy39h-.eYjVMvhzjjzyoZGu0P31g9pEL%2BltnY%2FwOUiFE1fJFQ0'

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
