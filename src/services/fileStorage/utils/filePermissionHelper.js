const logger = require('winston');

const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const RoleModel = require('../../role/model');
const { sortRoles } = require('../../role/utils/rolesHelper');

const getFile = id => FileModel
	.findOne({ _id: id })
	.populate('owner')
	.exec();

const checkTeamPermission = async ({ user, file, permission }) => {
	let teamRoles;

	try {
		teamRoles = sortRoles(await RoleModel.find({ name: /^team/ }).exec());
	} catch (error) {
		logger.error(error);
		return Promise.reject();
	}

	return new Promise((resolve, reject) => {
		const { role } = user;
		const { permissions } = file;
		const rolePermissions = permissions.find(perm => perm.refId.toString() === role.toString());

		const { role: creatorRole } = file.owner.userIds
			.find(_ => _.userId.toString() === file.permissions[0].refId.toString());

		const findRole = roleId => roles => roles
			.findIndex(r => r._id.toString() === roleId.toString()) > -1;

		if (permission === 'delete') {
			const userPos = teamRoles.findIndex(findRole(role));
			const creatorPos = teamRoles.findIndex(findRole(creatorRole));

			return userPos > creatorPos ? resolve(true) : reject();
		}

		return rolePermissions[permission] ? resolve(true) : reject();
	});
};

const checkPermissions = permission => async (user, file) => {
	const fileObject = await getFile(file);
	const {
		permissions,
		refOwnerModel,
		owner: { _id: owner },
	} = fileObject;

	// return always true for owner of file
	if (user.toString() === owner.toString()) {
		return Promise.resolve(true);
	}

	// or legacy course model
	if (refOwnerModel === 'course') {
		const userObject = await userModel.findOne({ _id: user }).populate('roles').exec();
		const isStudent = userObject.roles.find(role => role.name === 'student');

		if (isStudent) {
			const rolePermissions = permissions.find(
				perm => perm.refId && perm.refId.toString() === isStudent._id.toString(),
			);
			return rolePermissions[permission] ? Promise.resolve(true) : Promise.reject();
		}
		return Promise.resolve(true);
	}

	const teamMember = fileObject.owner.userIds && fileObject.owner.userIds
		.find(_ => _.userId.toString() === user.toString());
	const userPermissions = permissions
		.find(perm => perm.refId && perm.refId.toString() === user.toString());

	// User is either not member of Team
	// or file has no explicit user permissions (sharednetz files)
	if (!teamMember && !userPermissions) {
		return Promise.reject();
	}

	if (userPermissions) {
		return userPermissions[permission] ? Promise.resolve(true) : Promise.reject();
	}

	return checkTeamPermission({
		permission,
		file: fileObject,
		user: teamMember,
	});
};

module.exports = {
	checkPermissions,
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
};
