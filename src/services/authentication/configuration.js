const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticationSecret, audience } = require('./logic/index');

module.exports = {
	audience,
	authConfig: {
		entity: 'account',
		service: 'accountModel',
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
