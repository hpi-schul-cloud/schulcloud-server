'use strict';
const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const path = require('path');
const ClientOAuth2 = require('client-oauth2');

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
			authorizationUri: `${iservOptions.wwwroot}/iserv/oauth/v2/auth`,
		});

		return iservAuth.owner.getToken(username, password)
			.then((user) => {
				logger.info(user);
				return Promise.resolve(user);
			}).catch(err => {
				logger.info(err.body);
				return Promise.reject(err);
			});
	}
}

module.exports = IServLoginStrategy;
