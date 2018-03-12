'use strict';
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const ClientOAuth2 = require('client-oauth2');
const logger = require('winston');

const AbstractLoginStrategy = require('./interface.js');

class IServLoginStrategy extends AbstractLoginStrategy {
	login({username, password}, system) {

		const iservOptions = {
			username: username,
			password: password,
			grant_type: 'password',
			client_id: system.oaClientId,
			client_secret: system.oaClientSecret,
			wwwroot: system.url,
		};

		const iservAuth = new ClientOAuth2({
			clientId: iservOptions.client_id,
			clientSecret: iservOptions.client_secret,
			accessTokenUri: `${iservOptions.wwwroot}/iserv/oauth/v2/token`,
			authorizationUri: `${iservOptions.wwwroot}/iserv/oauth/v2/auth`
		});

		logger.debug("[iserv]: Trying to connect to IServ-Server");
		return iservAuth.owner.getToken(username, password)
			.then(client => {	// verify that the login did succeed
				if (!client.accessToken && !client.data.accessToken) return Promise.reject(new Error('failed to obtain token'));
				logger.debug("[iserv]: Successfully connect to IServ-Server");
				return Promise.resolve(client);
			});
	}
}

module.exports = IServLoginStrategy;
