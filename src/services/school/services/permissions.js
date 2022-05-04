const { authenticate } = require('@feathersjs/authentication');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const { iff, isProvider } = require('feathers-hooks-common');

const { BadRequest, Forbidden } = require('../../../errors');
const globalHooks = require('../../../hooks');
const { lookupSchool, restrictToCurrentSchool } = require('../../../hooks');

const checkPermissions = (context) => {
	if (
		context.path === 'school/teacher/studentvisibility' &&
		!Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE')
	) {
		throw new Forbidden('Configuring student visibility is not allowed.');
	}

	if (
		context.path === 'school/student/studentlernstorevisibility' &&
		!Configuration.get('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED')
	) {
		throw new Forbidden('Configuring lernstore access is not allowed.');
	}

	return context;
};

const hooks = {
	before: {
		all: [authenticate('jwt'), lookupSchool, iff(isProvider('external'), restrictToCurrentSchool)],
		get: [globalHooks.hasPermission('SCHOOL_PERMISSION_VIEW')],
		patch: [globalHooks.hasPermission('SCHOOL_PERMISSION_CHANGE'), checkPermissions],
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
		const schoolPermission = ((school.permissions || [])[this.role] || [])[this.permission];
		let isEnabled = false;
		if (schoolPermission === undefined) {
			const role = await this.app.service('roles').find({
				query: {
					name: this.role,
				},
			});
			isEnabled = role.data[0].permissions.includes(this.permission);
		} else {
			isEnabled = schoolPermission;
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
