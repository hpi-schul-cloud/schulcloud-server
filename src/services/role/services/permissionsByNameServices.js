// Do not proteced this route with authentication.
const PermissionsByNameServiceHooks = {
	before: {
		all: [],
		find: [],
	},
};

class PermissionsByNameService {
	constructor({ docs } = {}) {
		this.docs = docs;
	}

	setup(app) {
		this.app = app;
	}

	find(params) {
		const query = { name: params.route.roleName };
		return this.app.service('roles').find({ query })
			.then((roles) => roles.data[0].permissions)
			.catch(() => []);
	}
}

const configure = (app, path = '/roles/:roleName/permissions') => {
	app.use(path, new PermissionsByNameService());
	const permissionService = app.service(path);
	permissionService.hooks(PermissionsByNameServiceHooks);
};

module.exports = {
	PermissionsByNameService,
	PermissionsByNameServiceHooks,
	configure,
};
