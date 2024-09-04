const { Configuration } = require('@hpi-schul-cloud/commons');

module.exports = {
	audience: Configuration.get('JWT_AUD'),
	authConfig: {
		entity: 'account', // name of the found user in the request context
		// entityId and service are never queried, but need to be provided otherwise the server doesn't start
		entityId: 'id',
		service: 'emptyService', // This service is registered in 'index.js'
		secret: Configuration.get('JWT_AUTHENTICATION_SECRET'),
		authStrategies: ['jwt', 'tsp', 'api-key'],
		jwtOptions: {
			header: { typ: 'access' },
			audience: Configuration.get('JWT_AUD'),
			issuer: 'feathers',
			algorithm: 'HS256',
			expiresIn: Configuration.get('JWT_LIFETIME'),
		},
		tsp: {},
		'api-key': {},
	},
};
