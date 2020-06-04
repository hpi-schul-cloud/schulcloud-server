const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { lookupSchool } = require('../../../hooks');

const hooks = {
	before: {
		all: [
			authenticate('jwt'),
			lookupSchool,
		],
		find: [
			globalHooks.hasPermission('ROLE_VIEW'),
			globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW'),
		],
	},
};

const updateRoles = (userRoles, schoolPermissions) => {
	const updatedRoles = [];
	userRoles.forEach((role) => {
		const roleCopy = role;
		if (Object.keys(schoolPermissions).includes(role.name)) {
			Object.keys(schoolPermissions[role.name]).forEach((r) => {
				if (schoolPermissions[role.name][r] && !roleCopy.permissions.includes(r)) {
					roleCopy.permissions.push(r);
				} else if (!schoolPermissions[role.name][r]) {
					roleCopy.permissions = roleCopy.permissions.filter((permission) => permission !== r);
				}
			});
		}
		updatedRoles.push(roleCopy);
	});
	return updatedRoles;
};


class UserRoles {
	async find(params) {
		const { account } = params;

		const user = await this.app.service('users').get(account.userId);
		const [roles, school] = await Promise.all([
			this.app.service('roles').find({ query: { _id: user.roles } }),
			this.app.service('schools').get(user.schoolId),
		]);

		return {
			...roles,
			data: updateRoles(roles.data, school.permissions),
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	UserRoles,
	userRolesHooks: hooks,
};
