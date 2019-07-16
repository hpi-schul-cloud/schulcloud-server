const { userModel } = require('../../user/model');
const { submissionModel } = require('../../homework/model');

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

	if (!userIds && !teacherIds) {
		return false;
	}

	const finder = obj => user.equals(obj.userId || obj);

	return userIds.find(finder) || (teacherIds && teacherIds.find(finder));
};

const checkPermissions = permission => async (user, file) => {
	const {
		permissions,
		refOwnerModel,
		owner: { _id: owner },
	} = file;


	// return always true for owner of file
	if (user.toString() === owner.toString()) {
		return Promise.resolve(true);
	}

	const isMember = checkMemberStatus({ file, user });

	const userPermissions = permissions
		.find(perm => perm.refId && perm.refId.equals(user));

	// User is no member of team or course
	// and file has no explicit user permissions (sharednetz files)
	if (!isMember && !userPermissions) {
		return Promise.reject();
	}

	const isSubmission = await submissionModel.findOne({ fileIds: file._id }).lean().exec();

	// or legacy course model
	// TODO: Check member status of teacher if submission
	if (refOwnerModel === 'course' || isSubmission) {
		const userObject = await userModel.findOne({ _id: user }).populate({ path: 'roles' }).exec();
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

const checkPermissionsNew = permission => async (user, file) => {
	const {
		permissions,
		refOwnerModel,
		owner: { _id: owner },
	} = file;


	// return always true for owner of file
	if (user.toString() === owner.toString()) {
		return file;
	}

	const isMember = checkMemberStatus({ file, user });

	const userPermissions = permissions
		.find(perm => perm.refId && perm.refId.equals(user));

	// User is no member of team or course
	// and file has no explicit user permissions (sharednetz files)
	if (!isMember && !userPermissions) {
		return Promise.reject();
	}

	const isSubmission = await submissionModel.findOne({ fileIds: file._id }).lean().exec();

	// or legacy course model
	// TODO: Check member status of teacher if submission
	if (refOwnerModel === 'course' || isSubmission) {
		const userObject = await userModel.findOne({ _id: user }).populate({ path: 'roles' }).exec();
		const isStudent = userObject.roles.find(role => role.name === 'student');

		if (isStudent) {
			const rolePermissions = permissions.find(
				perm => perm.refId && perm.refId.toString() === isStudent._id.toString(),
			);

			return rolePermissions[permission] ? file : Promise.reject();
		}
		return file;
	}

	if (userPermissions) {
		return userPermissions[permission] ? file : Promise.reject();
	}

	return Promise.reject();
};

const getAllowedFiles = permission => (userId, files, app) => {
	const fileCheck = checkPermissionsNew(permission);

	const permissionPromises = files.map(file => fileCheck(userId, file));

	return Promise.all([checkTeamPermissionsNew(userId, files, permission, app), ...permissionPromises])
		.then(([allowedFilesTeam, ...allowedFiles]) => {
			const teamFiles = allowedFilesTeam
				.filter(teamFile => !allowedFiles
					.some(file => file._id.toString() === teamFile._id.toString()));


			return [...allowedFiles, ...teamFiles].map((file) => {
				file.owner = file.owner._id;

				return file;
			});
		});
};

module.exports = {
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),
	readFiles: getAllowedFiles('read'),
};
