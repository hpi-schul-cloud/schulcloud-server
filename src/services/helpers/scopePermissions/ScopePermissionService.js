const { ScopeService } = require('./ScopeService');

/**
 * Blueprint for a scope permission service, i.e. a service that returns a list of permissions for
 * a combination of userId and scope instance (a specific team, course, school, etc.).
 *
 * To use this class, create an instance via the `#initialize` method and add scope-specific business
 * logic via the `handler` parameter.
 *
 * @class ScopePermissionService
 * @extends {ScopeService}
 */
class ScopePermissionService extends ScopeService {
	/**
	 * Calls the handler function with the userId and the scope-object
	 * @param {ObjectId} userId the userId
	 * @param {*} scope the scope object
	 * @returns {Array<String>} an Array of permission names (strings)
	 * @memberof ScopePermissionService
	 */
	async getUserPermissions(userId, scope) {
		const permissions = await this.handler.apply(this, [userId, scope]);
		return permissions || [];
	}

	/**
	 * Implements `GET /scope-name/:scopeId/userPermissions/:userId` (or however the service was initialized)
	 * @param {ObjectId} userId the userId
	 * @param {Object} params Feathers request params
	 * @returns {Array<String>} an Array of permission names (strings)
	 * @memberof ScopePermissionService
	 */
	get(userId, params) {
		return this.getUserPermissions(userId, params.scope);
	}

	/**
	 * Implements `GET /scope-name/:scopeId/userPermissions` (or however the service was initialized)
	 * @param {Object} params Feathers request params
	 * @returns {Object<Array<String>>} an Array of permission names (strings) for each user in the query
	 * params (via `{userId: [...]}` or `{userId: {$in: [...]}}`)
	 * @memberof ScopePermissionService
	 */
	find(params) {
		const userIds = [];
		const query = params.query.userId;
		if (query) {
			if (query.$in) {
				userIds.concat(query.$in);
			} else {
				userIds.push(query);
			}
		}
		// for each user get the scope permissions and add them to a dictionary {userId: [permissions]}
		const ops = userIds.map(async (userId) => [userId, await this.getUserPermissions(userId, params.scope)]);
		return Promise.all(ops).then((results) =>
			results.reduce((agg, [key, value]) => {
				const newAgg = agg;
				newAgg[key] = value;
				return newAgg;
			}, {})
		);
	}
}

module.exports = {
	ScopePermissionService,
};
