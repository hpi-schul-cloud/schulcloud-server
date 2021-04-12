const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const Role = require('../model');

const hooks = {
	before: {
		all: [authenticate('jwt')],
		find: [globalHooks.hasPermission('ROLE_VIEW')],
	},
};

class PermissionService {
	async find(params) {
		const { roleName } = params.route;

		const role = await Role.findOne({
			name: roleName,
		}).exec();

		if (role) {
			return [
				...(await role.getPermissions()), // gives back a set
			];
		}

		return [];
	}
}

module.exports = {
	PermissionService,
	permissionHooks: hooks,
};
