const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const Role = require('../../role/model');
const { schoolModel: School } = require('../model');
const { lookupSchool } = require('../../../hooks');


const hooks = {
	before: {
		all: [
			authenticate('jwt'),
			globalHooks.hasPermission('ROLE_VIEW'),
			lookupSchool,
		],
		patch: [
			globalHooks.hasPermission('SCHOOL_PERMISSION_CHANGE'),
		],
	},
};


class HandlePermissions {
	async find(params) {
		const school = await School
			.findById(params.account.schoolId)
			.select(['permissions'])
			.exec();
		return school.permissions;
	}

	async patch(id, data, params) {
		const { permissions } = data;

		const role = await Role
			.findOne({
				name: 'teacher',
			})
			.exec();

		const school = await School
			.findById(params.account.schoolId)
			.select(['permissions'])
			.exec();

		const filterPermissions = (list, element) => list.filter((p) => p !== element);

		if (role && school) {
			const rolePermissions = [...await role.getPermissions()];
			const schoolPermissions = school.permissions;

			if (Object.prototype.hasOwnProperty.call(permissions, 'studentVisibility')) {
				// if there are special school permissions, toggle school permission
				if (Object.prototype.hasOwnProperty.call(schoolPermissions[role.name], 'STUDENT_LIST')) {
					schoolPermissions[role.name].STUDENT_LIST = permissions.studentVisibility;
					await school.updateOne({ permissions: schoolPermissions });
					return;
				}
				// else toggle role permissions
				if (permissions.studentVisibility && !rolePermissions.includes('STUDENT_LIST')) {
					rolePermissions.push('STUDENT_LIST');
					await role.updateOne({ permissions: rolePermissions });
				} else if (!permissions.studentVisibility) {
					await role.updateOne({ permissions: filterPermissions(rolePermissions, 'STUDENT_LIST') });
				}
			}
		}
	}
}

module.exports = {
	HandlePermissions,
	handlePermissionsHooks: hooks,
};
