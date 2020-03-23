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

const paginate = (result, { $limit, $skip } = {}) => ({
	total: result.length,
	limit: $limit,
	skip: $skip,
	data: result.slice($skip, $limit),
});

const filterByQueryKey = (roles, key, value) => {
	if (key.charAt(0) === '$') {
		return roles;
	}
	return roles.filter((r) => r[key] === value);
};

const filterByQuery = (roles, query = {}) => {
	let array = roles;
	Object.keys(query).forEach((key) => {
		array = filterByQueryKey(array, key, query[key]);
	});
	return array;
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

	async get(id, { query } = {}) {
		let result = await this.roles;
		result = filterByQuery(result, query);
		return result.find((r) => r._id.toString() === id);
	}

	async find({ query = {} } = {}) {
		let result = await this.roles;
		result = filterByQuery(result, query);
		return paginate(result, query);
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
	filterByQuery,
};
