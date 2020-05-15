const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { Configuration } = require('@schul-cloud/commons');

const {
	LdapStrategy, MoodleStrategy, IservStrategy, TSPStrategy, ApiKeyStrategy,
} = require('./strategies');
const { hooks } = require('./hooks');
const { authenticationSecret, audience } = require('./logic');

const authConfig = {
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
};

class SCAuthenticationService extends AuthenticationService {
	async getPayload(authResult, params) {
		return super.getPayload(authResult, {
			...params,
			payload: authResult.payload || params.payload,
		});
	}
}

module.exports = (app) => {
	// Configure feathers-authentication
	app.set('authentication', authConfig);
	const authentication = new SCAuthenticationService(app);

	authentication.register('jwt', new JWTStrategy());
	authentication.register('local', new LocalStrategy());
	authentication.register('ldap', new LdapStrategy());
	authentication.register('moodle', new MoodleStrategy());
	authentication.register('iserv', new IservStrategy());
	authentication.register('tsp', new TSPStrategy());
	authentication.register('api-key', new ApiKeyStrategy());

	app.use('/authentication', authentication);

	const authenticationService = app.service('authentication');
	authenticationService.hooks(hooks);
};
