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
	 * Will be called by feathers upon initialization of this service.
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

module.exports = {
	ScopeService,
};
