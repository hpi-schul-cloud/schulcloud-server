const { ScopeService } = require('./ScopeService');

/**
 * Implements retrieving a list of all scope instances a user has a specific permission in.
 * For example, this can be used to implement a service that returns the user's teams, courses, etc.
 * or only those where the user is admin, teacher, etc.
 * @class ScopeListService
 * @extends {ScopeService}
 */
class ScopeListService extends ScopeService {
	/**
	 * Calls the handler function with the userId, requested permissions, and request params (for further querying).
	 * @param {ObjectId} userId the userId
	 * @param {Array<String>} permissions the permissions
	 * @returns {Array<Object>} an Array of scope objects
	 * @memberof ScopePermissionService
	 */
	async getUserScopes(userId, permissions = [], params) {
		const scopes = await this.handler.apply(this, [userId, permissions, params]);
		return scopes || [];
	}

	/**
	 * Implements the route
	 * @param {Object} params Feathers request params
	 * @returns {Array<Object>} a list of scope objects
	 * @memberof ScopeListService
	 */
	find(params) {
		let list = [];
		if (params.query && params.query.permissions) {
			list = params.query.permissions;
		}
		return this.getUserScopes(params.scope, list, params);
	}
}

module.exports = {
	ScopeListService,
};
