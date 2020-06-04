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
		],
	},
};

const filterPermissions = (userRoles, schoolPermissions) => {
	const permissions = [];
	userRoles.forEach((role) => {
		if (Object.keys(schoolPermissions).includes(role)) {
			Object.keys(schoolPermissions[role]).forEach((r) => {
				if (schoolPermissions[role][r]) permissions.push(r);
			});
		}
	});
	return permissions;
};


class UserPermissions {
	async find(params) {
		const { account } = params;

		const user = await this.app.service('users').get(account.userId);
		const [roles, school] = await Promise.all([
			this.app.service('roles').find({ query: { _id: user.roles } }),
			this.app.service('schools').get(user.schoolId),
		]);

		const roleNames = roles.data.map((role) => role.name);
		const enabledSchoolPermissions = filterPermissions(roleNames, school.permissions);

		return [[...new Set([...user.permissions, ...enabledSchoolPermissions])]];
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	UserPermissions,
	userPermissionsHooks: hooks,
};
