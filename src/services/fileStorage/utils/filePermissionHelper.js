const { NotFound } = require('../../../errors');
const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const getFile = (id) => FileModel.findOne({ _id: id }).populate('owner').lean().exec();

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

	return Promise.resolve(true);
};

module.exports = {
	checkPermissions,
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
};
