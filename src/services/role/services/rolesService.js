const { RoleModel } = require('../model');

// do not proteced this route with authentication
const RoleServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [],
	},
};

const unique = (base, merge) => [...new Set([...base, ...merge])];

const dissolveInheritPermission = (roles, role) => {
	if (Array.isArray(role.roles) && role.roles[0]) {
		const inheritRoleId = role.roles[0].toString();
		const inheritRole = roles.find((r) => r._id.toString() === inheritRoleId);
		const { permissions } = dissolveInheritPermission(roles, inheritRole);
		role.permissions = unique(role.permissions, permissions);
	}
	return role;
};

const removeKeys = (keys = []) => (role) => {
	keys.forEach((key) => {
		delete role[key];
	});
	return role;
};

const paginate = (result, query = {}) => {
	// do stuff to paginate it
	return {
		total: result.length,
		limit: query.$limit,
		skip: query.$skip,
		data: result,
	};
};

const getRoles = (query = {}) => RoleModel.find(query).lean().exec();

/**
 * This is a static services.
 */
class RoleService {
	constructor({ docs } = {}) {
		this.docs = docs || {};
	}

	async init() {
		const filter = removeKeys(['createdAt', 'updatedAt', '__v']); // [roles']

		this.roles = getRoles()
			.then((roles) => roles.map((role) => filter(dissolveInheritPermission(roles, role))))
			.catch((err) => {
				throw new Error('Can not load roles from DB.', err);
			});
	}

	async get(id, params) {
		const result = await this.roles;
		return result;
	}

	async find(params) {
		const result = await this.roles;
		return paginate(result, params.query);
	}

	async setup(app) {
		this.app = app;
		await this.init();
	}
}

const configure = async (app, path = '/roles') => {
	app.use(path, new RoleService());
	const service = app.service(path);
	service.hooks(RoleServiceHooks);
};

module.exports = {
	configure,
	RoleService,
	RoleServiceHooks,
	getRoles,
	dissolveInheritPermission,
};
