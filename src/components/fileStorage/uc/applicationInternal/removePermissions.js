const repo = require('../../repo/files.repo');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const filePermissions = await repo.getFilesWithUserPermissionsByUserId(userId);
	const trashBinData = {
		scope: 'filePermission',
		data: filePermissions,
	};

	const complete = await repo.removeFilePermissionsByUserId(userId);

	return { complete, trashBinData };
};

module.exports = {
	removePermissionsThatUserCanAccess,
};
