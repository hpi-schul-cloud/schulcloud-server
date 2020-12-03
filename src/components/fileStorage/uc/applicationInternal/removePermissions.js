const logger = require('../../../../logger');

const repo = require('../../repo/files.repo');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	try {
		const filePermissions = await repo.getFilePermissionsByUserId(userId);
		const trashBinData = filePermissions.map((fp) => ({
			scope: 'filePermission',
			data: fp,
		}));

		const finished = await repo.removeFilePermissionsByUserId(userId);

		return { finished, trashBinData };
	} catch (err) {
		logger.warning('error during tombstone dissolve in file permissions', err);
		return { finished: false, trashBinData: [] };
	}
};

module.exports = {
	removePermissionsThatUserCanAccess,
};
