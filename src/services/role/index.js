const { UserPermissions, userPermissionsHooks } = require('./services/userPermissions');
const { UserRoles, userRolesHooks } = require('./services/userRoles');
const { definePermissions, PERMISSIONS, ROLES } = require('./utils/permissions');

const { configure } = require('./services/rolesService');
const { configure: configureRoleByName } = require('./services/permissionsByNameServices');

module.exports = (app) => {
	configure(app);
	configureRoleByName(app);

	app.use('/roles/user', new UserRoles());
	const userRoles = app.service('/roles/user');
	userRoles.hooks(userRolesHooks);

	app.use('/permissions/user', new UserPermissions());
	const userPermissions = app.service('/permissions/user');
	userPermissions.hooks(userPermissionsHooks);

	definePermissions(
		'ADMIN_TOGGLE_STUDENT_VISIBILITY',
		ROLES.TEACHER,
		PERMISSIONS.STUDENT_LIST,
		// TODO: importent add this again, after school permission service can handle multiple permissions
		// PERMISSIONS.STUDENT_EDIT,
		// PERMISSIONS.STUDENT_CREATE,
		// PERMISSIONS.STUDENT_DELETE,
	);

};
