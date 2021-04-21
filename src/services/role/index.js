const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const Role = require('./model');
const hooks = require('./hooks');
const { PermissionService, permissionHooks } = require('./services/permissions');
const { UserPermissions, userPermissionsHooks } = require('./services/userPermissions');
const { UserRoles, userRolesHooks } = require('./services/userRoles');
const { definePermissions, PERMISSIONS, ROLES } = require('./utils/permissions');
const { defaultWhitelist, regexWhitelist } = require('../../utils/whitelist');

module.exports = function setup() {
	const app = this;

	const options = {
		Model: Role,
		paginate: {
			default: 10,
			max: 25,
		},
		lean: { virtuals: true },
		multi: true,
		whitelist: [...defaultWhitelist, ...regexWhitelist],
	};

	app.use('/roles/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/roles/user', new UserRoles());
	const userRoles = app.service('/roles/user');
	userRoles.hooks(userRolesHooks);

	app.use('/permissions/user', new UserPermissions());
	const userPermissions = app.service('/permissions/user');
	userPermissions.hooks(userPermissionsHooks);

	app.use('/roles/:roleName/permissions', new PermissionService());
	const permissionService = app.service('/roles/:roleName/permissions');
	permissionService.hooks(permissionHooks);

	app.use('/roles', service(options));
	const roleService = app.service('/roles');
	roleService.hooks({
		before: hooks.before(),
		after: hooks.after,
	});

	definePermissions(
		'ADMIN_TOGGLE_STUDENT_VISIBILITY',
		ROLES.TEACHER,
		PERMISSIONS.STUDENT_LIST
		// TODO: importent add this again, after school permission service can handle multiple permissions
		// PERMISSIONS.STUDENT_EDIT,
		// PERMISSIONS.STUDENT_CREATE,
		// PERMISSIONS.STUDENT_DELETE,
	);
};
