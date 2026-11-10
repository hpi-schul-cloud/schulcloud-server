const { FilePermissionModel } = require('../model');
const RoleModel = require('../../role/model');

const createPermission = (refId, refPermModel = 'user', permissions = null) => {
	const newPermission = new FilePermissionModel({
		refId,
		refPermModel,
	});
	// override permissions
	if (permissions !== null) {
		Object.entries(permissions).forEach(([key, value]) => {
			newPermission[key] = value;
		});
	}

	return newPermission;
};

const getRoles = (names = []) =>
	RoleModel.find({
		$or: names.map((name) => ({ name })),
	})
		.lean()
		.exec();

const getRoleIdByName = (roles, name) => {
	const role = roles.find((r) => r.name === name);
	return role._id;
};

const setRefId = (perm) => {
	if (!perm.refId) {
		perm.refId = perm._id;
	}
	return perm;
};

const addCourseDefaultPermissions = async (permissions, studentCanEdit) => {
	const roles = await getRoles(['student', 'teacher']);
	const studentRoleId = getRoleIdByName(roles, 'student');
	const teacherRoleId = getRoleIdByName(roles, 'teacher');

	permissions.push(
		createPermission(studentRoleId, 'role', {
			write: Boolean(studentCanEdit),
			create: false,
			delete: false,
		})
	);

	permissions.push(
		createPermission(teacherRoleId, 'role', {
			create: false,
			delete: false,
		})
	);

	return permissions;
};

/**
 * @param {ObjectId} userId New owner of this file.
 * @param {String} type ['user', 'course'] | default = 'user'
 * @param {Object} [additionals] <optional> {studentCanEdit, sendPermissions}
 */
const createDefaultPermissions = async (
	userId,
	type = 'user',
	{ studentCanEdit, sendPermissions = [] } = { sendPermissions: [] }
) => {
	let permissions = [createPermission(userId)];

	if (type === 'course') {
		permissions = await addCourseDefaultPermissions(permissions, studentCanEdit);
	}

	return [...permissions, ...sendPermissions].map(setRefId);
};

module.exports = {
	createPermission,
	createDefaultPermissions,
};
