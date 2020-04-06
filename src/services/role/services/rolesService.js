const { NotFound } = require('@feathersjs/errors');
const { RoleModel } = require('../model');
const {
	preparedRoles,
	unique,
	filterByQuery,
	paginate,
} = require('../utils');

// Do not protect this route with authentication.
const RoleServiceHooks = {
	before: {
		all: [],
		find: [],
		get: [],
	},
};

const getModelRoles = () => RoleModel.find({}).lean().exec()
	.then((roles) => preparedRoles(roles));

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
	}

	async setup(app) {
		this.app = app;
		await this.init();
	}

	init() {
		this.roles = new Promise((resolve) => {
			getModelRoles().then((roles) => {
				resolve(roles);
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
		const roles = await this.roles;
		const role = roles.find((r) => r._id === id.toString());
		const result = filterByQuery([role], params.query);

		if (!result[0]) {
			throw new NotFound(this.err.notFound(id));
		}
		return result[0];
	}

	async find(params = {}) {
		// Please do not add || []; It must fail if the initialization failed.
		const roles = await this.roles;
		const result = filterByQuery(roles, params.query);
		return paginate(result, params.query);
	}
}

const configure = async (app, { path = '/roles' } = {}) => {
	app.use(path, new RoleService());
	const service = app.service(path);
	service.hooks(RoleServiceHooks);
};

module.exports = {
	configure,
	RoleService,
	RoleServiceHooks,
	getModelRoles,
};
