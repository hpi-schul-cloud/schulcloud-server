const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { NotAuthenticated } = reqlib('src/errors');
const { omit } = require('lodash');
const ClientOAuth2 = require('client-oauth2');
const logger = require('../../../logger');

class IservStrategy extends AuthenticationBaseStrategy {
	verifyConfiguration() {
		const config = this.configuration;

		['usernameField', 'systemIdField'].forEach((prop) => {
			if (typeof config[prop] !== 'string') {
				throw new Error(`'${this.name}' authentication strategy requires a '${prop}' setting`);
			}
		});
	}

	get configuration() {
		const authConfig = this.authentication.configuration;
		const config = super.configuration || {};

		return {
			service: authConfig.service,
			entity: authConfig.entity,
			entityId: authConfig.entityId,
			errorMessage: 'Invalid login',
			entityUsernameField: config.usernameField,
			entitySystemIdField: config.systemIdField,
			...config,
		};
	}

	async getEntityQuery(query, _params) {
		return {
			$limit: 1,
			...query,
		};
	}

	async findEntity(username, systemId, params) {
		const { entityUsernameField, entitySystemIdField, service, errorMessage } = this.configuration;
		const query = await this.getEntityQuery(
			{
				[entityUsernameField]: username,
				[entitySystemIdField]: systemId,
			},
			params
		);

		const findParams = { ...params, query };
		const entityService = this.app.service(service);

		const result = await entityService.find(findParams);
		const list = Array.isArray(result) ? result : result.data;

		if (!Array.isArray(list) || list.length === 0) {
			throw new NotAuthenticated(errorMessage);
		}

		const [entity] = list;

		return entity;
	}

	async getEntity(result, params) {
		const { entityService } = this;
		const { entityId = entityService.id, entity } = this.configuration;

		if (!entityId || result[entityId] === undefined) {
			throw new NotAuthenticated('Could not get iserv entity');
		}

		if (!params.provider) {
			return result;
		}

		return entityService.get(result[entityId], {
			...params,
			[entity]: result,
		});
	}

	async credentialCheck(username, password, system) {
		if (!username) {
			throw new NotAuthenticated('No username is set.');
		}
		if (!password) {
			throw new NotAuthenticated('No password is set.');
		}
		if (!system.url) {
			throw new NotAuthenticated('No iServ URL is provided.');
		}

		const { origin } = new URL(system.url);
		const iServOptions = {
			clientId: system.oaClientId,
			clientSecret: system.oaClientSecret,
			accessTokenUri: new URL('iserv/oauth/v2/token', origin).href,
			authorizationUri: new URL('iserv/oauth/v2/auth', origin).href,
		};
		const iservAuth = new ClientOAuth2(iServOptions);

		logger.debug('[iserv]: Trying to connect to IServ-Server');
		const client = await iservAuth.owner.getToken(username, password);

		if (!client.accessToken && !client.data.accessToken) {
			return false;
		}
		logger.debug('[iserv]: Successfully connect to IServ-Server');
		return client;
	}

	async authenticate(authentication, params) {
		const { app } = this;

		const system = await app.service('systems').get(authentication.systemId);

		const client = await this.credentialCheck(authentication.username, authentication.password, system);

		if (client) {
			const { entity } = this.configuration;
			const result = await this.findEntity(authentication.username, authentication.systemId, omit(params, 'provider'));

			return {
				authentication: { strategy: this.name },
				[entity]: await this.getEntity(result, params),
			};
		}
		throw new NotAuthenticated('Wrong Credentials - Unable to obtain token');
	}
}

module.exports = IservStrategy;
