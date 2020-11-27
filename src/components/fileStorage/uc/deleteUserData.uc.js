const logger = require('../../../logger');

const repo = require('../repo/files.repo');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	try {
		const { success: finished, filePermissions } = await repo.removeFilePermissionsByUserId(userId);

		const trashBinData = filePermissions.map((fp) => ({
			scope: 'filePermission',
			data: fp,
		}));

		return { finished, trashBinData };
	} catch (err) {
		logger.warning('error during tombstone dissolve in file permissions', err);
		return { finished: false, trashBinData: [] };
	}
};

const deleteUserData = async (userId) => {
	// step 1
	// await deletePersonalFiles(context);
	// step 2 -> Promise.all
	const result = await removePermissionsThatUserCanAccess(userId);
	// const replaceUserIds = await replaceUserId(userId); - step 2 or step 3

	// concatinate results

	return result;
};

module.exports = {
	deleteUserData,
	removePermissionsThatUserCanAccess,
};
