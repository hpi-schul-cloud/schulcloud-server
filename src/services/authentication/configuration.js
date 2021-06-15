const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticationSecret, audience } = require('./logic/index');

module.exports = {
	audience,
	authConfig: {
		entity: 'account',
		service: 'accountModel',
		secret: authenticationSecret,
		authStrategies: ['jwt', 'local', 'ldap', 'moodle', 'iserv', 'tsp', 'api-key'],
		jwtOptions: {
			header: { typ: 'access' },
			audience,
			issuer: 'feathers',
			algorithm: 'HS256',
			expiresIn: Configuration.get('JWT_LIFETIME'),
		},
		local: {
			usernameField: 'username',
			passwordField: 'password',
		},
		ldap: {
			usernameField: 'username',
		},
		moodle: {
			usernameField: 'username',
			systemIdField: 'systemId',
		},
		iserv: {
			usernameField: 'username',
			systemIdField: 'systemId',
		},
		tsp: {},
		'api-key': {},
	},
};
