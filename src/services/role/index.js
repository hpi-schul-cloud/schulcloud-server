const service = require('feathers-mongoose');
const Role = require('./model');
const hooks = require('./hooks');
const { PermissionService, permissionHooks } = require('./services/permissions');
const { UserPermissions, userPermissionsHooks } = require('./services/userPermissions');
const { UserRoles, userRolesHooks } = require('./services/userRoles');
const { definePermissions, PERMISSIONS, ROLES } = require('./utils/permissions');

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

	app.use('/roles/user/roles', new UserRoles());
	const userRoles = app.service('/roles/user/roles');
	userRoles.hooks(userRolesHooks);

	app.use('/roles/user/permissions', new UserPermissions());
	const userPermissions = app.service('/roles/user/permissions');
	userPermissions.hooks(userPermissionsHooks);

	app.use('/roles/:roleName/permissions', new PermissionService());
	const permissionService = app.service('/roles/:roleName/permissions');
	permissionService.hooks(permissionHooks);


	definePermissions(
		'FEATURE_ADMIN_TOGGLE_STUDENT_VISIBILITY',
		ROLES.TEACHER,
		PERMISSIONS.STUDENT_LIST,
		PERMISSIONS.STUDENT_EDIT,
		PERMISSIONS.STUDENT_CREATE,
		PERMISSIONS.STUDENT_DELETE,
	);
};
