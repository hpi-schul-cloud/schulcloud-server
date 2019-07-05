const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { lookupScope, rejectQueryingOtherUsers } = require('./hooks');

class ScopeService {
	constructor(handler) {
		this.handler = handler;
	}

	async setup(app) {
		this.app = app;
	}

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

	static initialize(app, path, handler) {
		if (!handler) {
			throw new Error(`ScopePermisionService initialized at '${path}' without handler.`);
		}

		app.use(path, new this(handler));
		const scopePermissionService = app.service(path);
		scopePermissionService.hooks(this.hooks());
	}
}

class ScopePermissionService extends ScopeService {
	async getUserPermissions(userId, scope) {
		const permissions = await this.handler.apply(this, [userId, scope]);
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

class ScopeListService extends ScopeService {
	async getUserScopes(userId, permissions = []) {
		const scopes = await this.handler.apply(this, [userId, permissions]);
		return scopes || [];
	}

	find(params) {
		let list = [];
		if (params.query && params.query.permissions) {
			list = params.query.permissions;
		}
		return this.getUserScopes(params.scope, list);
	}

	static hooks() {
		return {
			before: {
				all: [
					globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
					lookupScope,
				],
			},
		};
	}
}

class ScopeFileService extends ScopeService {
	async find(params) {
		return this.handler.apply(this, [
			params.userId,
			params.scope,
			params.files,
		]);
	}

	static hooks() {
		return {
			before: {
				all: [
					globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
					lookupScope,
				],
			},
		};
	}
}

module.exports = {
	ScopeService,
	ScopePermissionService,
	ScopeListService,
	ScopeFileService,
};
