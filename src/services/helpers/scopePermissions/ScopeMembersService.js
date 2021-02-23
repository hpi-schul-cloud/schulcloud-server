const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { ScopeService } = require('./ScopeService');
const { lookupScope, checkScopePermissions } = require('./hooks');

/**
 * Implements retrieving a list of all users who are associated with a scope.
 * @class ScopeMembersService
 * @extends {ScopeService}
 */
class ScopeMembersService extends ScopeService {
	/**
	 * Custom set of hooks.
	 * @static
	 * @returns Object<FeathersHooksCollection>
	 * @override ScopeService#hooks
	 * @memberof ScopeMembersService
	 */
	static hooks() {
		return {
			before: {
				all: [
					globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
					lookupScope,
					globalHooks.ifNotLocal(checkScopePermissions(['SCOPE_PERMISSIONS_VIEW'])),
				],
			},
		};
	}

	/**
	 * Implements the route
	 * @param {Object} params Feathers request params
	 * @returns {Array<ObjectId>} a list of userIds
	 * @memberof ScopeMembersService
	 */
	async find(params) {
		const members = (await this.handler.apply(this, [params])) || [];
		return members;
	}
}

module.exports = {
	ScopeMembersService,
};
