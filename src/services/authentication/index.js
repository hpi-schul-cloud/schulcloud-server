const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { LdapStrategy, MoodleStrategy, IservStrategy, TSPStrategy, ApiKeyStrategy } = require('./strategies');
const { hooks } = require('./hooks');
const { authConfig } = require('./configuration');

class SCAuthenticationService extends AuthenticationService {
	async getUserData(user, account) {
		return {
			accountId: account._id,
			systemId: account.systemId,
			userId: user._id,
			schoolId: user.schoolId,
			roles: user.roles,
		};
	}
	async getPayload(authResult, params) {
		let payload = await super.getPayload(authResult, params);
		const user = await this.app.service('usersModel').get(authResult.account.userId);
		const userData = await this.getUserData(user, authResult.account);

		if (authResult.account && authResult.account.userId) {
			payload = {
				...payload,
				...userData,
			};
		}
		return payload;
	}
}

module.exports = (app) => {
	app.use('/authentication/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
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
