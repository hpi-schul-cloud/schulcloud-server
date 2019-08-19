const _ = require('lodash');
const logger = require('../../../logger');

const { FileModel } = require('../model');
const { userModel } = require('../../user/model');
const RoleModel = require('../../role/model');
const { sortRoles } = require('../../role/utils/rolesHelper');
const { submissionModel } = require('../../homework/model');

const getFile = id => FileModel
	.findOne({ _id: id })
	.populate('owner')
	.lean()
	.exec();

const checkTeamPermission = async ({ user, file, permission }) => {
	let teamRoles;

	try {
		teamRoles = sortRoles(await RoleModel.find({ name: /^team/ }).lean().exec());
	} catch (error) {
		logger.error(error);
		return Promise.reject();
	}

	return new Promise((resolve, reject) => {
		const { role } = user;
		const { permissions } = file;
		const rolePermissions = permissions.find(perm => perm.refId.toString() === role.toString()) || [];

		const { role: creatorRole } = file.owner.userIds
			.find(_ => _.userId.toString() === file.permissions[0].refId.toString());

		const findRole = roleId => roles => roles
			.findIndex(r => r._id.toString() === roleId.toString()) > -1;

		const userPos = teamRoles.findIndex(findRole(role));
		const creatorPos = teamRoles.findIndex(findRole(creatorRole));

		if (userPos > creatorPos || rolePermissions[permission]) {
			resolve(true);
		}
		reject();
	});
};

const checkMemberStatus = ({ file, user }) => {
	const { owner: { userIds, teacherIds } } = file;
	const finder = obj => user.equals(obj.userId || obj);

	if (!userIds && !teacherIds) {
		return false;
	}

	return userIds.find(finder) || (teacherIds && teacherIds.find(finder));
};

const checkPermissions = permission => async (user, file) => {
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
	// TODO: Check member status of teacher if submission
	if (refOwnerModel === 'course' || isSubmission) {
		const userObject = await userModel.findOne({ _id: user }).populate('roles').lean().exec();
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

	return checkTeamPermission({
		permission,
		file: fileObject,
		user: isMember,
	});
};

const checkScopePermissions = async (scopeName, userId, files, permission, app) => {
	const listService = app.service(`/users/:scopeId/${scopeName}`);
	const scope = await listService.find({
		route: { scopeId: userId.toString() },
	});

	const fileListService = app.service(`/${scopeName}/:scopeId/files`);
	const fileMap = await fileListService.find({
		route: { scopeId: scope[0]._id },
		userId,
		files,
	});

	return fileMap.filter(file => file.permissions[permission]).map(file => file.file);
};

const checkPermissionsLegacy = permission => async (user, file) => {
	const {
		permissions,
		refOwnerModel,
	} = file;

	const isMember = checkMemberStatus({ file, user });

	// User is no member of team or course
	if (!isMember) {
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

	return Promise.reject();
};

const mapOwner = fn => (...args) => fn(...args).then(allFiles => allFiles.map((file) => {
	file.owner = file.owner._id;
	return file;
}));

const getAllowedFiles = permission => mapOwner(async (userId, files, app) => {
	const [directPermissionFiles, noDirectPermissionFiles] = files.reduce(([allowedF, otherF], currentFile) => {
		// check if is owner of file (allowed to do anything)
		if (userId.equals(currentFile.owner._id)) {
			allowedF.push(currentFile);
		} else {
			// check if user has the required permission explicitly
			const userPermissions = currentFile.permissions.find(perm => perm.refId && perm.refId.equals(userId));
			if (userPermissions) {
				allowedF.push(currentFile);
			} else {
				otherF.push(currentFile);
			}
		}
		return [allowedF, otherF];
	}, [[], []]);

	if (noDirectPermissionFiles.length === 0) return directPermissionFiles;

	// scoped file check
	const fileMap = noDirectPermissionFiles.reduce((acc, currentFile) => {
		if (!acc[currentFile.refOwnerModel]) {
			acc[currentFile.refOwnerModel] = [];
		}

		acc[currentFile.refOwnerModel].push(currentFile);
		return acc;
	}, {});

	const scopeFiles = {};
	const fileCheck = checkPermissionsLegacy(permission);

	for (const scope of Object.keys(fileMap)) {
		try {
			scopeFiles[scope] = await checkScopePermissions(scope, userId, fileMap[scope], permission, app);
		} catch (e) {
			const legacyPermissionFiles = fileMap[scope].map(file => fileCheck(userId, file));

			scopeFiles[scope] = (await Promise.all(legacyPermissionFiles));
		}
	}

	// restore file input order
	const allFiles = Object.values(scopeFiles).reduce((acc, cur) => [...acc, cur], []);
	return _.sortBy(allFiles, curFile => files.findIndex(file => file.equals(curFile)));
});

module.exports = {
	checkPermissions,
	canWrite: checkPermissions('write'),
	canRead: checkPermissions('read'),
	canCreate: checkPermissions('create'),
	canDelete: checkPermissions('delete'),

	canWriteFiles: getAllowedFiles('write'),
	canReadFiles: getAllowedFiles('read'),
	canCreateFiles: getAllowedFiles('create'),
	canDeleteFiles: getAllowedFiles('delete'),
};
