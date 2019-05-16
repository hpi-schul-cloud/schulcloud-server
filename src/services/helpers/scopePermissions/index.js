const { hooks } = require('./hooks');

class ScopePermissionService {
	static initialize(app, path, permissionHandler) {
		if (!permissionHandler) {
			throw new Error(`ScopePermisionService initialized at '${path}' without permissionHandler.`);
		}

		app.use(path, new ScopePermissionService(permissionHandler));
		const scopePermissionService = app.service(path);
		scopePermissionService.hooks(hooks);
	}

	constructor(permissionHandler) {
		this.permissionHandler = permissionHandler;
	}

	async setup(app) {
		this.app = app;
	}

	async getUserPermissions(userId, scope) {
		const permissions = await this.permissionHandler.apply(this, [userId, scope]);
		return permissions || [];
	}

	get(userId, params) {
		return this.getUserPermissions(userId, params.scope);
	}

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
		const ops = userIds.map(async userId => [userId, await this.getUserPermissions(userId, params.scope)]);
		return Promise.all(ops)
			.then(results => results.reduce((agg, [key, value]) => {
				const newAgg = agg;
				newAgg[key] = value;
				return newAgg;
			}, {}));
	}
}

module.exports = {
	ScopePermissionService,
};
