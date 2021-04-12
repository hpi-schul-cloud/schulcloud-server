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
 * 'opt-out', 'enabled' - set the permissions to the given role
 * 'opt-in', 'disabled', undefined - removes them from the given role
 *
 * @param {String} env
 * @param {String} role
 * @param  {...String} permissions
 */
const definePermissions = (env, role, ...permissions) => {
	if (['opt-out', 'enabled'].includes(Configuration.get(env))) {
		// set defaul permission
		Role.update(
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
	} else if (['opt-in', 'disabled', undefined].includes(Configuration.get(env))) {
		// remove defaul permission
		Role.update(
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
