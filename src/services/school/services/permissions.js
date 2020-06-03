const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
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

const getSchool = (ctx, schoolId) => ctx.service('schools').get(schoolId);

const updateSchoolPermissions = (ctx, schoolId, permissions) => ctx
	.service('schools')
	.patch(
		schoolId,
		{ permissions },
	);

class HandlePermissions {
	constructor(role, permission) {
		this.role = role || '';
		this.permission = permission || '';
	}

	async find(params) {
		const school = await getSchool(this.app, params.account.schoolId);
		return school.permissions[this.role] || {};
	}

	async patch(id, data, params) {
		const { permissions } = data;
		const { schoolId } = params.account;
		const school = await getSchool(this.app, schoolId);

		if (school) {
			const schoolPermissions = school.permissions || {};

			switch (this.permission) {
				case 'studentVisibility':
					if (!Object.prototype.hasOwnProperty.call(schoolPermissions, this.role)) {
						schoolPermissions[this.role] = {};
					}
					schoolPermissions[this.role].STUDENT_LIST = permissions.studentVisibility;
					await updateSchoolPermissions(this.app, schoolId, schoolPermissions);
					break;
				default:
					break;
			}
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	HandlePermissions,
	handlePermissionsHooks: hooks,
};
