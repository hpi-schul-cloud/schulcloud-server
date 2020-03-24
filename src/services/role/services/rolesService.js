/* eslint-disable no-param-reassign */
const { NotFound } = require('@feathersjs/errors');
const { RoleModel } = require('../model');

// Do not proteced this route with authentication.
const RoleServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [],
	},
};

const removeKeys = (keys = []) => (role) => {
	keys.forEach((key) => {
		delete role[key];
	});
	return role;
};

const paginate = (result, { $limit, $skip = 0 } = {}) => ({
	total: result.length,
	limit: $limit || result.length,
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
		this.err = Object.freeze({
			solved: 'Can not solved the role',
			load: 'Can not load roles from DB, or can not solved pre mutations.',
		});
		this.roles = undefined;
		this.rolesDisplayName = Object.freeze({
			teacher: 'Lehrer',
			student: 'Schüler',
			administrator: 'Administrator',
			superhero: 'Schul-Cloud Admin',
			demo: 'Demo',
			demoTeacher: 'Demo',
			demoStudent: 'Demo',
			helpdesk: 'Helpdesk',
			betaTeacher: 'Beta',
			expert: 'Experte',
		});
		this.filterKeys = Object.freeze([]); // ['createdAt', 'updatedAt', 'roles', '__v']
	}

	async setup(app) {
		this.app = app;
		await this.init();
	}

	async init() {
		this.roles = new Promise(async (resolve) => {
			const filter = removeKeys(this.filterKeys);
			const roles = await getRoles();
			const preparedRoles = roles.map((role) => {
				role = filter(this.dissolveInheritPermission(roles, role));
				if (this.rolesDisplayName[role.name]) {
					role.displayName = this.rolesDisplayName[role.name];
				}
				role._id = role._id.toString();
				return role;
			});
			resolve(preparedRoles);
		});
	}

	unique(...permissions) {
		return [...new Set(Array.prototype.concat.apply([], permissions))];
	}

	dissolveInheritPermission(roles, role) {
		if (Array.isArray(role.roles) && role.roles[0]) {
			const inheritRoleId = role.roles[0].toString();
			const inheritRole = roles.find((r) => r._id.toString() === inheritRoleId);
			const { permissions } = this.dissolveInheritPermission(roles, inheritRole);
			role.permissions = this.unique(role.permissions, permissions);
		}
		return role;
	}

	async getPermissionsByRoles(roleIds = []) {
		const ids = roleIds.map((id) => id.toString());
		const selectedRoles = (await this.roles).filter((r) => ids.includes(r._id));
		return this.unique(...selectedRoles.map((r) => r.permissions));
	}

	async get(id, params) {
		const result = filterByQuery(await this.roles, params.query);
		const role = result.find((r) => r._id === id.toString());

		if (!role) {
			throw new NotFound(`Role by ${id} not found.`);
		}
		return role;
	}

	async find(params) {
		const result = filterByQuery(await this.roles, params.query);
		return paginate(result, params.query);
	}
}

let staticRoleService;
const configure = async (app, path = '/roles') => {
	app.use(path, new RoleService());
	const service = app.service(path);
	service.hooks(RoleServiceHooks);
	staticRoleService = service;
};

module.exports = {
	configure,
	RoleService,
	RoleServiceHooks,
	getRoles,
	filterByQuery,
	paginate,
	staticRoleService,
};
