const { AuthenticationService } = require('@feathersjs/authentication');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { NotImplemented } = require('@feathersjs/errors');
const { TSPStrategy, ApiKeyStrategy, CustomJwtStrategy } = require('./strategies');
const { hooks } = require('./hooks');
const { authConfig } = require('./configuration');

class SCAuthenticationService extends AuthenticationService {
	async getUserData(user, account) {
		return {
			accountId: account._id ? account._id : account.id,
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
	app.set('authentication', authConfig); // TODO: Why? Can it be removed, i do not found it with app.get('')
	const authentication = new SCAuthenticationService(app);

	authentication.register('tsp', new TSPStrategy());

	// JWT strategy needs to stay active in feathers to enable hooks "authenticate('jwt')"
	authentication.register('jwt', new CustomJwtStrategy());
	// api-key strategy needs to stay active in feathers to enable hooks "authenticate('api-key')"
	authentication.register('api-key', new ApiKeyStrategy());

	// used to fullfil feathers authentication contract, see 'configuration.js'
	app.use('emptyService', {
		find: () => {
			throw NotImplemented();
		},
	});
	app.use('/authentication', authentication);

	const authenticationService = app.service('authentication');
	authenticationService.hooks(hooks);
};
