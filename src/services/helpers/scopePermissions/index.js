const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { lookupScope, rejectQueryingOtherUsers } = require('./hooks');

/**
 * Base class for scope services (nested under a top-level service)
 * @class ScopeService
 */
class ScopeService {
	/**
	 * Creates an instance of ScopeService.
	 * @param {Function} handler instance-specific code
	 * @memberof ScopeService
	 */
	constructor(handler) {
		this.handler = handler;
	}

	/**
	 * Will be called by feathers upon initialization of this service.	 *
	 * @param {App} app
	 * @memberof ScopeService
	 */
	async setup(app) {
		this.app = app;
	}

	/**
	 * Default set of hooks. Ready to override by sub-classes.
	 * @static
	 * @returns Object<FeathersHooksCollection>
	 * @memberof ScopeService
	 */
	static hooks() {
		return {
			before: {
				all: [
					globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
					globalHooks.ifNotLocal(rejectQueryingOtherUsers),
					lookupScope,
				],
			},
		};
	}

	/**
	 * Initializes this service at a specific route and adds hooks and use-case-specific handler.
	 * @static
	 * @param {App} app the feathers app
	 * @param {String} path service path to use
	 * @param {Function} handler use-case-specific code
	 * @returns {ScopePermissionService} the service instance
	 * @memberof ScopeService
	 */
	static initialize(app, path, handler) {
		if (!handler) {
			throw new Error(`ScopePermisionService initialized at '${path}' without handler.`);
		}

		app.use(path, new this(handler));
		const scopePermissionService = app.service(path);
		scopePermissionService.hooks(this.hooks());
		return scopePermissionService;
	}
}

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
		const ops = userIds.map(async userId => [userId, await this.getUserPermissions(userId, params.scope)]);
		return Promise.all(ops)
			.then(results => results.reduce((agg, [key, value]) => {
				const newAgg = agg;
				newAgg[key] = value;
				return newAgg;
			}, {}));
	}
}

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
	ScopeService,
	ScopePermissionService,
	ScopeListService,
};
