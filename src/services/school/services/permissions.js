const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { schoolModel: School } = require('../model');
const { lookupSchool } = require('../../../hooks');


const hooks = {
	before: {
		all: [
			authenticate('jwt'),
			globalHooks.hasPermission('ROLE_VIEW'),
			lookupSchool,
		],
		get: [
			globalHooks.hasPermission('ROLE_VIEW'),
			// globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW'),

		],
		patch: [
			globalHooks.hasPermission('ROLE_VIEW'),
			// globalHooks.hasPermission('ROLE_EDIT'),
			// globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW'),
			globalHooks.hasPermission('SCHOOL_PERMISSION_CHANGE'),
		],
	},
};

const getSchool = async (schoolId) => {
	const school = await School
		.findById(schoolId)
		.select(['permissions'])
		.exec();
	return school;
};

class HandlePermissions {
	constructor(role, permission) {
		this.role = role || '';
		this.permission = permission || '';
	}

	async find(params) {
		const school = await getSchool(params.account.schoolId);
		return school.permissions[this.role] || {};
	}

	async patch(id, data, params) {
		const { permissions } = data;
		const school = await getSchool(params.account.schoolId);

		if (school) {
			const schoolPermissions = school.permissions || {};

			switch (this.permission) {
				case 'studentVisibility':
					if (Object.prototype.hasOwnProperty.call(schoolPermissions[this.role], 'STUDENT_LIST')) {
						schoolPermissions[this.role].STUDENT_LIST = permissions.studentVisibility;
						await school.updateOne({ permissions: schoolPermissions });
					}
					break;
				default:
					break;
			}
		}
	}
}

module.exports = {
	HandlePermissions,
	handlePermissionsHooks: hooks,
};
