const { FilePermissionModel } = require('../model');
const RoleModel = require('../../role/model');
const { teamsModel } = require('../../teams/model');

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

const fetchAndCreateTeamDefaultPermissions = async (owner) => {
	const [teamObject, teamRoles] = await Promise.all([
		teamsModel.findOne({ _id: owner }).lean().exec(),
		RoleModel.find({ name: /^team/ }).lean().exec(),
	]);
	const { filePermission: defaultPermissions } = teamObject;

	// takes care every role is named in permissions
	return teamRoles.map(({ _id: roleId }) => {
		const defaultPerm = defaultPermissions.find(({ refId }) => roleId.equals(refId));

		return defaultPerm || createPermission(roleId, 'role');
	});
};

/**
 * @param {ObjectId} userId New owner of this file.
 * @param {String} type ['user', 'course', 'teams'] | default = 'user'
 * @param {Object} [additionals] <optional> {studentCanEdit, sendPermissions, owner}
 */
const createDefaultPermissions = async (
	userId,
	type = 'user',
	{ studentCanEdit, sendPermissions = [], owner } = { sendPermissions: [] }
) => {
	let permissions = [createPermission(userId)];
	let teamDefaultPermissions = [];

	if (type === 'course') {
		permissions = await addCourseDefaultPermissions(permissions, studentCanEdit);
	} else if (type === 'teams' && sendPermissions.length <= 0) {
		teamDefaultPermissions = await fetchAndCreateTeamDefaultPermissions(owner);
	}

	return [...permissions, ...sendPermissions, ...teamDefaultPermissions].map(setRefId);
};

module.exports = {
	createPermission,
	createDefaultPermissions,
};
