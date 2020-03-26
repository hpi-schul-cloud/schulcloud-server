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

let ServiceShouldPreparedRoles = false;

const rolesDisplayName = Object.freeze({
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

const unique = (...permissions) => ([...new Set(Array.prototype.concat.apply([], permissions))]);

const dissolveInheritPermission = (roles, role) => {
	if (Array.isArray(role.roles) && role.roles[0]) {
		const inheritRoleId = role.roles[0].toString(); // TODO: only first role is used, model should changed
		const inheritRole = roles.find((r) => r._id.toString() === inheritRoleId);
		const { permissions } = dissolveInheritPermission(roles, inheritRole);
		role.permissions = unique(role.permissions, permissions);
	}
	return role;
};

const preparedRoles = (roles, displayName) => roles.map((role) => {
	role = dissolveInheritPermission(roles, role);
	role.displayName = displayName[role.name] || '';
	role._id = role._id.toString();
	return role;
});

const getModelRoles = (query = {}) => RoleModel.find(query)
	.lean().exec().then((roles) => (ServiceShouldPreparedRoles ? preparedRoles(roles, rolesDisplayName) : roles));

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
		// this.filterKeys = Object.freeze([]); // ['createdAt', 'updatedAt', 'roles', '__v']
		this.rolesDisplayName = rolesDisplayName;
	}

	async setup(app) {
		this.app = app;
		await this.init(true);
	}

	async init() {
		this.roles = new Promise((resolve) => {
			getModelRoles().then((roles) => {
				const savedRoles = ServiceShouldPreparedRoles ? preparedRoles(roles, this.rolesDisplayName) : roles;
				resolve(savedRoles);
			}).catch((err) => {
				throw new Error(this.err.load, err);
			});
		});
	}

	async getPermissionsByRoles(roleIds = []) {
		const ids = roleIds.map((id) => id.toString());
		const selectedRoles = (await this.roles).filter((r) => ids.includes(r._id));
		return unique(...selectedRoles.map((r) => r.permissions));
	}

	async get(id, params = {}) {
		const result = filterByQuery(await this.roles, params.query);
		const role = result.find((r) => r._id === id.toString());

		if (!role) {
			throw new NotFound(`Role by ${id} not found.`);
		}
		return role;
	}

	async find(params = {}) {
		const result = filterByQuery(await this.roles, params.query);
		return paginate(result, params.query);
	}
}

const configure = async (app, { path = '/roles', prepared = ServiceShouldPreparedRoles } = {}) => {
	ServiceShouldPreparedRoles = prepared;
	app.use(path, new RoleService());
	const service = app.service(path);
	service.hooks(RoleServiceHooks);
};

module.exports = {
	configure,
	RoleService,
	RoleServiceHooks,
	getModelRoles,
	rolesDisplayName,
	ServiceShouldPreparedRoles,
};
