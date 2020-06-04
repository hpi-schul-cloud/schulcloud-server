const { authenticate } = require('@feathersjs/authentication');
const { lookupSchool } = require('../../../hooks');
const { restrictGetToCurrentUser } = require('../hooks/userRoles');

const hooks = {
	before: {
		all: [
			authenticate('jwt'),
			lookupSchool,
		],
		get: [
			restrictGetToCurrentUser,
			// TODO: check it is restircted to current user and maybe some other have privileges
			// globalHooks.hasPermission('ROLE_VIEW'),
			// globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW'),
		],
	},
};

const updateRoles = (userRoles = [], schoolPermissions = {}) => userRoles.map((role) => {
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
		const { account } = params;

		const user = await this.app.service('users').get(account.userId);
		const [roles, school] = await Promise.all([
			this.app.service('roles').find({ query: { _id: user.roles } }), // TODO: do $in here otherwise it could not handle arrays
			this.app.service('schools').get(user.schoolId),
		]);

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
