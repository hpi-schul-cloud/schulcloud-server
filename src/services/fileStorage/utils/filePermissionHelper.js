const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const { submissionModel } = require('../../homework/model');

const getFile = id => FileModel
	.findOne({ _id: id })
	.populate('owner')
	.exec();

const checkTeamPermissionsNew = async (userId, files, permission, app) => {
	const teamListService = app.service('/users/:scopeId/teams');
	const teams = await teamListService.find({
		route: { scopeId: userId.toString() },
	});

	const fileListService = app.service('/teams/:scopeId/files');
	const fileMap = await fileListService.find({
		route: { scopeId: teams[0]._id },
		userId,
		files,
	});

	return fileMap.filter(file => file.permissions[permission]).map(file => file.file);
};

const checkMemberStatus = ({ file, user }) => {
	const { owner: { userIds, teacherIds } } = file;
	const finder = obj => user.equals(obj.userId || obj);

	if (!userIds && !teacherIds) {
		return false;
	}

	return userIds.find(finder) || teacherIds.find(finder);
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

	const isMember = checkMemberStatus({ file: fileObject, user });
	const userPermissions = permissions
		.find(perm => perm.refId && perm.refId.toString() === user.toString());

	// User is no member of team or course
	// and file has no explicit user permissions (sharednetz files)
	if (!isMember && !userPermissions) {
		return Promise.reject();
	}

	const isSubmission = await submissionModel.findOne({ fileIds: fileObject._id });

	// or legacy course model
	if (refOwnerModel === 'course' || isSubmission) {
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

	if (userPermissions) {
		return userPermissions[permission] ? Promise.resolve(true) : Promise.reject();
	}

	return false;
};

module.exports = {
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
	checkTeamPermissionsNew,
};
