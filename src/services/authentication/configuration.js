const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticationSecret, audience } = require('./logic/index');

module.exports = {
	audience,
	authConfig: {
		entity: 'account', // name of the found user in the request context
		// entityId and service are never queried, but need to be provided otherwise the server doesn't start
		entityId: 'noId',
		service: 'emptyService', // This service is registered in 'index.js'
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
