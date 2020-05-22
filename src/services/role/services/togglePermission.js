const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const Role = require('../model');


const hooks = {
	before: {
		all: [
			authenticate('jwt'),
			globalHooks.hasPermission('ROLE_VIEW'),
		],
	},
};


class TogglePermission {
	async patch(id, data, params) {
		const { roleName } = params.route;
		const { toggle, permission } = params.query;

		const role = await Role.findOne({
			name: roleName,
		}).exec();

		const filterPermissions = (list, element) => list.filter((p) => p !== element);

		if (role) {
			const permissions = [...await role.getPermissions()];

			switch (permission) {
				case 'studentVisibility':
					if (toggle === 'true' && !permissions.includes('STUDENT_LIST')) {
						permissions.push('STUDENT_LIST');
						await role.updateOne({ permissions });
						return [...await role.getPermissions()];
					} if (toggle === 'false') {
						await role.updateOne({ permissions: filterPermissions(permissions, 'STUDENT_LIST') });
						return [...await role.getPermissions()];
					}
					break;
				default:
					break;
			}
		}
		return [];
	}
}

module.exports = {
	TogglePermission,
	togglePermissionHooks: hooks,
};
