const { NotFound } = require('@feathersjs/errors');
const { RoleModel } = require('../model');
const { preparedRoles, unique } = require('../utils/preparedRoles');

// Do not proteced this route with authentication.
const RoleServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [],
	},
};

let ServiceShouldPreparedRoles = false;

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

const paginate = (result, { $limit, $skip = 0 } = {}) => ({
	total: result.length,
	limit: $limit || result.length,
	skip: $skip,
	data: result.slice($skip, $limit),
});

const getModelRoles = (query = {}) => RoleModel.find(query)
	.lean().exec()
	.then((roles) => {
		if(!roles) {
			console.log('query', query);
		}
		return roles;
	})
	.then((roles) => (ServiceShouldPreparedRoles ? preparedRoles(roles) : roles));

/**
 * This is a static services.
 */
class RoleService {
	constructor({ docs } = {}) {
		this.docs = docs || {};
		this.err = Object.freeze({
			load: 'Can not load roles from DB, or can not solved pre mutations.',
			notFound: (id) => `Role by ${id} not found.`,
		});
		this.roles = undefined;
		// this.filterKeys = Object.freeze([]); // ['createdAt', 'updatedAt', 'roles', '__v']
	}

	async setup(app) {
		this.app = app;
		await this.init(true);
	}

	async init() {
		this.roles = new Promise((resolve) => {
			getModelRoles().then((roles) => {
				const savedRoles = ServiceShouldPreparedRoles ? preparedRoles(roles) : roles;
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
			throw new NotFound(this.err.notFound(id));
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
	statics: {
		ServiceShouldPreparedRoles,
	},
};
