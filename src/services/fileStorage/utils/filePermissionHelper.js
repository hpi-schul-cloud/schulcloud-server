const logger = require('../../../logger');

const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const RoleModel = require('../../role/model');
const { sortRoles } = require('../../role/utils/rolesHelper');
const { submissionModel: Submission, homeworkModel: Homework } = require('../../homework/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const getFile = (id) => FileModel
	.findOne({ _id: id })
	.populate('owner')
	.lean()
	.exec();

const checkTeamPermission = async ({ user, file, permission }) => {
	let teamRoles;
	let sortedTeamRoles;
	const roleIndex = {};

	try {
		teamRoles = await RoleModel.find({ name: /^team/ }).lean().exec();
		teamRoles.forEach((role) => { roleIndex[role._id] = role; });
		sortedTeamRoles = sortRoles(teamRoles);
	} catch (error) {
		logger.error(error);
		return Promise.reject();
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

		const { role: creatorRole } = file.owner.userIds
			.find((_) => equalIds(_.userId, file.permissions[0].refId));

		const findRole = (roleId) => (roles) => roles
			.findIndex((r) => equalIds(r._id, roleId)) > -1;

		const userPos = sortedTeamRoles.findIndex(findRole(role));
		const creatorPos = sortedTeamRoles.findIndex(findRole(creatorRole));

		if (userPos > creatorPos || rolePermissions[permission]) {
			resolve(true);
		}
		reject();
	});
};

const checkMemberStatus = ({ file, user }) => {
	const { owner: { userIds, teacherIds, substitutionIds } } = file;
	const finder = (obj) => user.equals(obj.userId || obj);

	return [userIds, teacherIds, substitutionIds]
		.reduce((result, list) => result || (list && list.find(finder)), false);
};

const checkPermissions = (permission) => async (user, file) => {
	const fileObject = await getFile(file);
	if (fileObject === undefined || fileObject === null) {
		throw new Error('File does not exist.', { user, file, permission });
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

	const userPermissions = permissions
		.find((perm) => perm.refId && perm.refId.toString() === user.toString());

	if (userPermissions && userPermissions[permission]) {
		return Promise.resolve(true);
	}

	const submission = await Submission.findOne({ fileIds: fileObject._id }).lean().exec();
	if (refOwnerModel === 'course' || submission) {
		const userObject = await userModel.findOne({ _id: user }).populate('roles').lean().exec();
		const isStudent = userObject.roles.find((role) => role.name === 'student');
		let courseFile = fileObject;
		if (submission) {
			const homework = await Homework.findOne({ _id: submission.homeworkId }).populate('courseId').lean().exec();
			courseFile = { ...fileObject, owner: homework.courseId || {} };
		}
		const isMember = checkMemberStatus({ file: courseFile, user });
		if (isMember) {
			if (isStudent) {
				const rolePermissions = permissions.find(
					(perm) => perm.refId && equalIds(perm.refId, isStudent._id),
				);
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
