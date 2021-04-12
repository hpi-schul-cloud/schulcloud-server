const { authenticate } = require('@feathersjs/authentication');
const { lookupSchool } = require('../../../hooks');
const { restrictGetToCurrentUser } = require('../hooks/userRoles');
const rolesModel = require('../model');

const hooks = {
	before: {
		all: [authenticate('jwt'), lookupSchool],
		get: [
			restrictGetToCurrentUser,
			// TODO: check it is restircted to current user and maybe some other have privileges
			// globalHooks.hasPermission('ROLE_VIEW'),
			// globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW'),
		],
	},
};

const updateRoles = (userRoles = [], schoolPermissions = {}) =>
	userRoles.map((role) => {
		if (Object.keys(schoolPermissions).includes(role.name)) {
			Object.keys(schoolPermissions[role.name]).forEach((r) => {
				if (schoolPermissions[role.name][r] && !role.permissions.includes(r)) {
					role.permissions.push(r);
				} else if (!schoolPermissions[role.name][r]) {
					role.permissions = role.permissions.filter((permission) => permission !== r);
				}
			});
		}
		return role;
	});

class UserRoles {
	async get(id, params) {
		const user = await this.app.service('users').get(id);
		const [roles, school] = await Promise.all([
			this.app.service('roles').find({ query: { _id: { $in: user.roles } } }),
			this.app.service('schools').get(user.schoolId),
		]);
		const permissions = await Promise.all(roles.data.map((role) => rolesModel.resolvePermissions(role.roles)));
		roles.data.forEach((role, i) => {
			role.permissions = [...new Set([...role.permissions, ...permissions[i]])];
		});

		return updateRoles(roles.data, school.permissions);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	UserRoles,
	userRolesHooks: hooks,
};
