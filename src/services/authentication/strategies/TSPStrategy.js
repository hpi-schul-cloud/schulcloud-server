const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');
const { omit } = require('lodash');
//const { jose } = require('jose');

class TSPStrategy extends AuthenticationBaseStrategy {

	get configuration() {

		const authConfig = this.authentication.configuration;
		const config = super.configuration || {};
		return {
			service: authConfig.service,
			entity: authConfig.entity,
			entityId: authConfig.entityId,
			errorMessage: 'Invalid login',
			entityUsernameField: config.usernameField,
			...config,
		};
	}

	verifyConfiguration() {

		const config = this.configuration;
		['usernameField'].forEach((prop) => {
			if (typeof config[prop] !== 'string') {
				throw new Error(`'${this.name}' authentication strategy requires a '${prop}' setting`);
			}
		});
	}

	async authenticate(authentication, params) {

		const { app } = this;
		const user = await app.service('users').get(authentication.ticket);
		const { entity } = this.configuration;
		const result = await this.findEntity(authentication.ticket, omit(params, 'provider'));
		return {
			authentication: { strategy: this.name },
			[entity]: await this.getEntity(result, params),
		};
	}

	/**
	 *
	 * @param ticket
	 */
	decryptTSPTicket(ticket) {

		// Get Payload out of the Ticket
		const payload = new Buffer(ticket.split('.')[1], 'base64').toString();
		// Decrypt Payload
		const payloadDecrypted = jose.JWE.decrypt(payload, this.configuration.encryptKeyJWK);

		return payloadDecrypted;
	}

	/*
	async authenticate(authentication, params) {
		const { app } = this;
		const ldapService = app.service('ldap');

		const user = await app.service('users').get(params.payload.userId);
		const system = await app.service('systems').get(authentication.systemId);
		if (user && system) {
			const isAuthenticated = await ldapService.authenticate(
				system,
				user.ldapDn,
				authentication.password,
			);
			if (isAuthenticated) {
				const { entity } = this.configuration;
				const result = await this.findEntity(authentication.username, omit(params, 'provider'));
				return {
					authentication: { strategy: this.name },
					[entity]: await this.getEntity(result, params),
				};
			}
		}
		throw new NotAuthenticated('Wrong Credentials - LDAP refused Login');
	}

	async getEntityQuery(query, _params) {
		return {
			$limit: 1,
			...query,
		};
	}

	async findEntity(username, params) {

		const { entityUsernameField, service, errorMessage } = this.configuration;
		const query = await this.getEntityQuery({
			[entityUsernameField]: username,
		}, params);

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
	*/
}


module.exports = TSPStrategy;
