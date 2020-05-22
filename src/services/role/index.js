const service = require('feathers-mongoose');
const Role = require('./model');
const hooks = require('./hooks');
const { PermissionService, permissionHooks } = require('./services/permissions');
const { TogglePermission, togglePermissionHooks } = require('./services/togglePermission');


module.exports = function setup() {
	const app = this;

	const options = {
		Model: Role,
		paginate: {
			default: 10,
			max: 25,
		},
		lean: { virtuals: true },
	};

	app.use('/roles', service(options));
	const roleService = app.service('/roles');
	roleService.hooks({
		before: hooks.before(),
		after: hooks.after,
	});

	app.use('/roles/:roleName/permissions', new PermissionService());
	const permissionService = app.service('/roles/:roleName/permissions');
	permissionService.hooks(permissionHooks);

	app.use('/roles/:roleName/togglepermission', new TogglePermission());
	const togglePermissionService = app.service('/roles/:roleName/togglepermission');
	togglePermissionService.hooks(togglePermissionHooks);
};
