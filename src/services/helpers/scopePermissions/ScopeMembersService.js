const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { ScopeService } = require('./ScopeService');
const { lookupScope, checkScopePermissions } = require('./hooks');

/**
 * Implements retrieving a list of all users who are associated with a scope.
 * @class ScopeMemberService
 * @extends {ScopeService}
 */
class ScopeMemberService extends ScopeService {
	/**
     * Custom set of hooks.
     * @static
     * @returns Object<FeathersHooksCollection>
	 * @override ScopeService#hooks
     * @memberof ScopeMemberService
     */
	static hooks() {
		return {
			before: {
				all: [
					globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
					lookupScope,
					checkScopePermissions(['SCOPE_PERMISSIONS_VIEW']),
				],
			},
		};
	}

	/**
     * Implements the route
     * @param {Object} params Feathers request params
     * @returns {Array<ObjectId>} a list of userIds
     * @memberof ScopeMemberService
     */
	async find(params) {
		const members = await this.handler.apply(this, [params]) || [];
		return members;
	}
}

module.exports = {
	ScopeMemberService,
};
