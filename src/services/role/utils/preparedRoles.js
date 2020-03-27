/* eslint-disable no-param-reassign */
const { rolesDisplayName } = require('../statics');

const addDisplayName = (role) => {
	role.displayName = rolesDisplayName[role.name] || '';
	return role;
};

const unique = (...permissions) => ([...new Set(Array.prototype.concat.apply([], permissions))]);

const dissolveInheritPermission = (roles, role) => {
	if (Array.isArray(role.roles)) {
		role.roles.forEach((inheritRoleId) => {
			const inheritRole = roles.find((r) => r._id.toString() === inheritRoleId.toString());
			const { permissions } = dissolveInheritPermission(roles, inheritRole);
			role.permissions = unique(role.permissions, permissions);
		});
	}
	return role;
};

const preparedRoles = (roles = [], rolesForResolve) => roles.map((role) => {
	role = dissolveInheritPermission(rolesForResolve || roles, role);
	role._id = role._id.toString();
	return addDisplayName(role);
});

module.exports = {
	preparedRoles,
	dissolveInheritPermission,
	unique,
	addDisplayName,
};
