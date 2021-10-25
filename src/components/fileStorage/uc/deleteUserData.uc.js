const { AssertionError } = require('../../../errors');

const filesRepo = require('../repo/files.repo');

const { facadeLocator } = require('../../../utils/facadeLocator');

const { trashBinResult } = require('../../helper/uc.helper');

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const [data, complete] = await Promise.all([
		filesRepo.getFilesWithUserPermissionsByUserId(userId),
		filesRepo.removeFilePermissionsByUserId(userId),
	]);

	return trashBinResult({ scope: 'filePermission', data, complete });
};

/**
 * Delete personal files from the given user
 * @param {BSON|BSONString} userId
 */
const removePersonalFiles = async (userId) => {
	const personalFiles = await filesRepo.getPersonalFilesByUserId(userId);
	const personalFileIds = personalFiles.map((file) => file._id);
	const trashBinData = {
		scope: 'files',
		data: personalFileIds,
	};
	if (personalFiles.length === 0) {
		return { trashBinData, complete: true };
	}

	const complete = await filesRepo.removePersonalFilesByUserId(userId);

	return { trashBinData, complete };
};

const deleteUserData = [removePermissionsThatUserCanAccess, removePersonalFiles];

module.exports = {
	private: {
		removePermissionsThatUserCanAccess,
		removePersonalFiles,
	},
	deleteUserData,
};
