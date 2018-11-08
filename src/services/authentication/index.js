'use strict';

const auth = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const local = require('feathers-authentication-local');
const logger = require('winston');

const extractors = require('passport-jwt').ExtractJwt;

const system = require('./strategies/system');
const hooks = require('./hooks');


let secrets;
try {
	(process.env.NODE_ENV === 'production') ? secrets = require('../../../config/secrets.js') : secrets = require('../../../config/secrets.json');
} catch(error) {
	secrets = {};
}

let authenticationSecret = (secrets.authentication) ? secrets.authentication : "secrets";

module.exports = function() {
    const app = this;

	const authConfig = Object.assign({}, app.get('auth'), {
		header: 'Authorization',
		entity: 'account',
		service: 'accounts',
		jwt: {
			header: { typ: 'access' },
			audience: 'https://schul-cloud.org',
			subject: 'anonymous',
			issuer: 'feathers',
			algorithm: 'HS256',
			expiresIn: '30d'
		},
		secret: authenticationSecret
	});


	const localConfig = {
		name: 'local',
		entity: 'account',
		service: 'accounts',

		// TODO: change username to unique identifier as multiple
		// users can have same username in different services
		usernameField: 'username',
		passwordField: 'password'
	};

	const cookieExtractor = function(req) {
		let cookies = req.headers.cookie;
		try {
			cookies = cookies.split(';');
			let jwt = undefined;
			cookies.map(cookie => {
				if (cookie.includes('jwt')) {
					cookie = cookie.split('=');
					if(cookie[0] === 'jwt') {
						jwt = cookie[1];
					}
				}
			});
			return jwt;
		} catch(e) {
			return undefined;
		}
	};

	const jwtConfig = {
		name: 'jwt',
		entity: 'account',
		service: 'accounts',
		header: 'Authorization',
		jwtFromRequest: extractors.fromExtractors([
			cookieExtractor, 
			extractors.fromHeader("authorization")
		]),
		secretOrKey: authenticationSecret
	};


	// Configure feathers-authentication
	app.configure(auth(authConfig));
	app.configure(jwt(jwtConfig));
	app.configure(local(localConfig));

	app.configure(system({
		name: 'moodle',
		loginStrategy: require('../account/strategies/moodle')
	}));

	app.configure(system({
		name: 'itslearning',
		loginStrategy: require('../account/strategies/itslearning')
	}));

	app.configure(system({
		name: 'iserv',
		loginStrategy: require('../account/strategies/iserv')
	}));


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
	};*/

	// Set up our hooks
	authenticationService.hooks({
		before: hooks.before,
		after: hooks.after
	});
};

