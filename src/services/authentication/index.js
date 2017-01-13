'use strict';

const auth = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const local = require('feathers-authentication-local');

const hooks = require('./hooks');

module.exports = function() {
    const app = this;

	const authConfig = app.get('auth');


	const localConfig = {
		name: 'local',
		entity: 'account',
		service: 'accounts',

		// TODO: change username to unique identifier as multiple
		// users can have same username in different services
		usernameField: 'username',
		passwordField: 'password'
	};

	// Configure feathers-authentication
	app.configure(auth(authConfig));
	app.configure(jwt());
	app.configure(local(localConfig));

	const authenticationService = app.service('authentication');

	// Set up our hooks
	authenticationService.hooks({
		before: hooks.before,
		after: hooks.after
	});
};

