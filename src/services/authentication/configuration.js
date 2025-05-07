const { Configuration } = require('@hpi-schul-cloud/commons');

module.exports = {
	audience: Configuration.get('SC_DOMAIN'),
	authConfig: {
		entity: 'account', // name of the found user in the request context
		// entityId and service are never queried, but need to be provided otherwise the server doesn't start
		entityId: 'id',
		service: 'emptyService', // This service is registered in 'index.js'

		// The idea to concatenate the keys is from this feathers issue: https://github.com/feathersjs/feathers/issues/1251
		// Furthermore: Node's process.env escapes newlines. We need to reverse it for the keys to work.
		secret:
			Configuration.get('JWT_PRIVATE_KEY').replace(/\\n/g, '\n') +
			Configuration.get('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
		authStrategies: ['jwt', 'api-key'],
		jwtOptions: {
			header: { typ: 'JWT' },
			audience: Configuration.get('SC_DOMAIN'),
			issuer: Configuration.get('SC_DOMAIN'),
			algorithm: Configuration.get('JWT_SIGNING_ALGORITHM'),
			expiresIn: Configuration.get('JWT_LIFETIME'),
		},
		tsp: {},
		'api-key': {},
	},
};
