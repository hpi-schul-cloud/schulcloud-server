const { Configuration } = require('@hpi-schul-cloud/commons');
const Role = require('../model');

const PERMISSIONS = {
	STUDENT_LIST: 'STUDENT_LIST',
	STUDENT_EDIT: 'STUDENT_EDIT',
	STUDENT_DELETE: 'STUDENT_DELETE',
	STUDENT_CREATE: 'STUDENT_CREATE',
};

const ROLES = {
	TEACHER: 'teacher',
};

/**
 * Set or remove permission, depending of the env value
 *
 * @param {String} env
 * @param {String} role
 * @param  {...String} permissions
 */
const definePermissions = (env, role, ...permissions) => {
	if (Configuration.get(env)) {
		// set defaul permission
		Role.updateOne(
			{
				name: role,
			},
			{
				$addToSet: {
					permissions: {
						$each: permissions,
					},
				},
			},
			{ multi: true }
		).exec();
	} else {
		// remove defaul permission
		Role.updateOne(
			{
				name: role,
			},
			{
				$pull: {
					permissions: {
						$in: permissions,
					},
				},
			},
			{ multi: true }
		).exec();
	}
};

module.exports = {
	definePermissions,
	PERMISSIONS,
	ROLES,
};
