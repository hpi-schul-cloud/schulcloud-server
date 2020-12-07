const repo = require('../../repo/files.repo');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const filePermissions = await repo.getFilePermissionsByUserId(userId);
	const trashBinData = filePermissions.map((fp) => ({
		scope: 'filePermission',
		data: fp,
	}));

	const complete = await repo.removeFilePermissionsByUserId(userId);

	return { complete, trashBinData };
};

module.exports = {
	removePermissionsThatUserCanAccess,
};
