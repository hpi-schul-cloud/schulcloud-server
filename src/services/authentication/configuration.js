const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticationSecret, audience } = require('./logic/index');

module.exports = {
	audience,
	authConfig: {
		entity: 'account', // name of the found user in the request context
		service: 'usersModel', // never queried, but an existing feathers service needs to be provided otherwise the server doesn't start
		secret: authenticationSecret,
		authStrategies: ['jwt', 'tsp', 'api-key'],
		jwtOptions: {
			header: { typ: 'access' },
			audience,
			issuer: 'feathers',
			algorithm: 'HS256',
			expiresIn: Configuration.get('JWT_LIFETIME'),
		},
		tsp: {},
		'api-key': {},
	},
};
