'use strict';

const auth = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const local = require('feathers-authentication-local');

const hooks = require('./hooks');

module.exports = function() {
    const app = this;

	const authConfig = Object.assign({}, app.get('auth'), {
		header: 'Authorization',
		entity: 'account',
		service: 'accounts',
		jwt: {
			header: { typ: 'access' },
			audience: 'https://yourdomain.com',
			subject: 'anonymous',
			issuer: 'feathers',
			algorithm: 'HS256',
			expiresIn: '1d'
		}
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

	const jwtConfig = {
		name: 'jwt',
		entity: 'account',
		service: 'accounts',
		header: 'Authorization'
	};

	// Configure feathers-authentication
	app.configure(auth(authConfig));
	app.configure(jwt(jwtConfig));
	app.configure(local(localConfig));

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

