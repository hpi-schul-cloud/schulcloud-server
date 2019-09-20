const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

class LdapStrategy extends AuthenticationBaseStrategy {
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
				return {
					authentication: { strategy: this.name },
				};
			}
		}
		throw new NotAuthenticated('Wrong Credentials - LDAP refused Login');
	}
}

module.exports = LdapStrategy;
