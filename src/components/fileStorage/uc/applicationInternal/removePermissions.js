const repo = require('../../repo/files.repo');
const { trashBinResult } = require('../../../helper/uc.helper');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const data = await repo.getFilesWithUserPermissionsByUserId(userId);
	const complete = await repo.removeFilePermissionsByUserId(userId);

	return trashBinResult({ scope: 'filePermission', data, complete });
};

module.exports = {
	removePermissionsThatUserCanAccess,
};
