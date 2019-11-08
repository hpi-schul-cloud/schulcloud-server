const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');

const { LdapStrategy, MoodleStrategy, IservStrategy } = require('./strategies');
const hooks = require('./hooks');
const { authenticationSecret, audience } = require('./logic');

/*
let secrets;
try {
	if (['production', 'lokal'].includes(process.env.NODE_ENV)) {
		// eslint-disable-next-line global-require
		secrets = require('../../../config/secrets.js');
	} else {
		// eslint-disable-next-line global-require
		secrets = require('../../../config/secrets.json');
	}
} catch (error) {
	secrets = {};
}

const authenticationSecret = (secrets.authentication) ? secrets.authentication : 'secrets';
if (process.env.NODE_ENV === 'production' && !secrets.authentication) {
	logger.error('use default authentication secret');
}
*/
const authConfig = {
	entity: 'account',
	service: 'accounts',
	secret: authenticationSecret,
	authStrategies: ['jwt', 'local', 'ldap', 'moodle', 'iserv'],
	jwtOptions: {
		header: { typ: 'access' },
		audience,
		issuer: 'feathers',
		algorithm: 'HS256',
		expiresIn: '30d',
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
};

module.exports = (app) => {
	// Configure feathers-authentication
	app.set('authentication', authConfig);
	const authentication = new AuthenticationService(app);

	authentication.register('jwt', new JWTStrategy());
	authentication.register('local', new LocalStrategy());
	authentication.register('ldap', new LdapStrategy());
	authentication.register('moodle', new MoodleStrategy());
	authentication.register('iserv', new IservStrategy());

	app.use('/authentication', authentication);

	const authenticationService = app.service('authentication');

	// TODO: feathers-swagger
	/*
    authenticationService.docs = {
        description: 'A service to send and receive messages',
        create: {
            //type: 'Example',
            parameters: [{
                description: 'username or email',
                //in: 'path',
                required: true,
                name: 'username',
                type: 'string'
            },
                {
                    description: 'password',
                    //in: 'path',
                    required: false,
                    name: 'password',
                    type: 'string'
                },
                {
                    description: 'ID of the system that acts as a login provider. Required for new accounts or accounts with non-unique usernames.',
                    //in: 'path',
                    required: false,
                    name: 'systemId',
                    type: 'string'
                }],
            summary: 'Log in with or create a new account',
            notes: 'Returns a JSON Web Token for the associated user in case of success.'
            //errorResponses: []
        }
    }; */

	// Set up our hooks
	authenticationService.hooks(hooks);
};
