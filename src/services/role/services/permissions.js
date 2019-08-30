const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const Role = require('../model');

const hooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [
			globalHooks.hasPermission('ROLE_VIEW'),
		],
	},
};


class PermissionService {
	async find(params) {
		const { roleName } = params.route;

		const role = await Role.findOne({
			name: roleName,
		}).exec();

		const permissions = [
			...await role.getPermissions(), // gives back an Set
		];

		return permissions;
	}
}

module.exports = {
	PermissionService,
	permissionHooks: hooks,
};
