/* eslint-disable no-param-reassign */
const { BadRequest, NotFound } = require('@feathersjs/errors');
const { RoleModel } = require('../model');

// Do not proteced this route with authentication.
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
		this.err = {
			solved: 'Can not solved the role',
			load: 'Can not load roles from DB, or can not solved pre mutations.',
		};
		this.roles = [];
		this.rolesDisplayName = {
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
		};
	}

	async setup(app) {
		this.app = app;
		await this.init();
	}

	async init() {
		try {
			const filter = removeKeys(); // ['createdAt', 'updatedAt', 'roles', '__v']
			const roles = await getRoles();
			this.roles = roles.map((role) => {
				role = filter(dissolveInheritPermission(roles, role));
				if (this.rolesDisplayName[role.name]) {
					role.displayName = this.rolesDisplayName[role.name];
				}
				return role;
			});
		} catch (err) {
			throw new Error(this.err.load, err);
		}
	}

	async get(id, { query } = {}) {
		let role;
		try {
			let result = await this.roles;
			result = filterByQuery(result, query);
			role = result.find((r) => r._id.toString() === id);
		} catch (err) {
			throw new BadRequest(this.err.solved, err);
		}
		if (!role) {
			throw new NotFound();
		}
		return role;
	}

	async find({ query = {} } = {}) {
		try {
			let result = await this.roles;
			result = filterByQuery(result, query);
			return paginate(result, query);
		} catch (err) {
			throw new BadRequest(this.err.solved, err);
		}
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
