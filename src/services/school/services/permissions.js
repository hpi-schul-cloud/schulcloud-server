const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');

const { BadRequest } = require('../../../errors');
const globalHooks = require('../../../hooks');
const { lookupSchool, restrictToCurrentSchool } = require('../../../hooks');

const hooks = {
	before: {
		all: [authenticate('jwt'), lookupSchool, iff(isProvider('external'), restrictToCurrentSchool)],
		get: [globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW')],
		patch: [globalHooks.hasPermission('SCHOOL_PERMISSION_CHANGE')],
	},
};

const getSchool = (ctx, schoolId) => ctx.service('schools').get(schoolId);

const updateSchoolPermissions = (ctx, schoolId, permissions) => ctx.service('schools').patch(schoolId, { permissions });

class HandlePermissions {
	constructor(role, permission) {
		this.role = role || '';
		this.permission = permission || '';
	}

	async find(params) {
		const school = await getSchool(this.app, params.account.schoolId);
		const schoolPermision = ((school.permissions || [])[this.role] || [])[this.permission];
		let isEnabled = false;
		if (schoolPermision === undefined) {
			const role = await this.app.service('roles').find({
				query: {
					name: this.role,
				},
			});
			isEnabled = role.data[0].permissions.includes(this.permission);
		} else {
			isEnabled = schoolPermision;
		}
		return { isEnabled };
	}

	async patch(id, data, params) {
		const { permission } = data;
		const { schoolId } = params.account;
		const school = await getSchool(this.app, schoolId);

		if (!school) {
			throw new BadRequest('Data are wrong');
		}
		const schoolPermissions = school.permissions || {};

		if (!Object.prototype.hasOwnProperty.call(schoolPermissions, this.role)) {
			schoolPermissions[this.role] = {};
		}
		schoolPermissions[this.role][this.permission] = permission.isEnabled;
		return updateSchoolPermissions(this.app, schoolId, schoolPermissions);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	HandlePermissions,
	handlePermissionsHooks: hooks,
};
