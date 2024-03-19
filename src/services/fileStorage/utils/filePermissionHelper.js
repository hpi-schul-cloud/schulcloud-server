const { NotFound } = require('../../../errors');
const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const RoleModel = require('../../role/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const getFile = (id) => FileModel.findOne({ _id: id }).populate('owner').lean().exec();

const checkTeamPermission = async ({ user, file, permission }) => {
	let teamRoles;
	const roleIndex = {};

	try {
		teamRoles = await RoleModel.find({ name: /^team/ }).lean().exec();
		teamRoles.forEach((role) => {
			roleIndex[role._id] = role;
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return new Promise((resolve, reject) => {
		const { role } = user;
		const { permissions } = file;
		let rolePermissions;

		let rolesToTest = [role];
		while (rolesToTest.length > 0 && rolePermissions === undefined) {
			const roleId = rolesToTest.pop().toString();
			rolePermissions = permissions.find((perm) => equalIds(perm.refId, roleId));
			rolesToTest = rolesToTest.concat(roleIndex[roleId].roles || []);
		}

		if (rolePermissions[permission]) {
			resolve(true);
		}
		reject();
	});
};

const checkMemberStatus = ({ file, user }) => {
	const {
		owner: { userIds, teacherIds, substitutionIds },
	} = file;
	const finder = (obj) => user.toString() === (obj.userId || obj).toString();

	return [userIds, teacherIds, substitutionIds].reduce((result, list) => result || (list && list.find(finder)), false);
};

const checkPermissions = (permission) => async (user, file) => {
	const fileObject = await getFile(file);
	if (fileObject === undefined || fileObject === null) {
		throw new NotFound('File does not exist.', { user, file, permission });
	}
	const {
		permissions,
		refOwnerModel,
		owner: { _id: owner },
	} = fileObject;

	// return always true for owner of file
	if (equalIds(user, owner)) {
		return Promise.resolve(true);
	}

	const userPermissions = permissions.find((perm) => perm.refId && perm.refId.toString() === user.toString());

	if (userPermissions && userPermissions[permission]) {
		return Promise.resolve(true);
	}

	if (refOwnerModel === 'course') {
		const userObject = await userModel.findOne({ _id: user }).populate('roles').lean().exec();
		const isStudent = userObject.roles.find((role) => role.name === 'student');
		const isMember = checkMemberStatus({ file: fileObject, user });
		if (isMember) {
			if (isStudent) {
				const rolePermissions = permissions.find((perm) => perm.refId && equalIds(perm.refId, isStudent._id));
				return rolePermissions[permission] ? Promise.resolve(true) : Promise.reject();
			}
			return Promise.resolve(true);
		}
		return Promise.reject();
	}

	const isMember = checkMemberStatus({ file: fileObject, user });

	// User is no member of team or course
	// and file has no explicit user permissions (sharednetz files)
	if (!isMember && !userPermissions) {
		return Promise.reject();
	}

	return checkTeamPermission({
		permission,
		file: fileObject,
		user: isMember,
	});
};

module.exports = {
	checkPermissions,
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
};
