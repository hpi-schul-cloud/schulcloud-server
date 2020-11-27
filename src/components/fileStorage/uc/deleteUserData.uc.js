const reqlib = require('app-root-path').require;

const logger = require('../../../logger');

const { Unprocessable } = reqlib('src/errors');

const { BadRequest } = require('../../../services/activation/utils/generalUtils');
const repo = require('../repo/files.repo');

// Todo: delete
const { userModel } = require('../../../services/user/model');
const { schoolModel } = require('../../../services/school/model');

const isUserPermission = (userId) => (p) => p.refId.toString() === userId.toString() && p.refPermModel === 'user';

const extractIds = (result = []) => result.map(({ _id }) => _id);

const extractStorageIds = (result = []) => result.map(({ storageFileName }) => storageFileName);

const handleIncompleteDeleteOperations = async (resultStatus, context, dbFindOperation) => {
	if (resultStatus.ok !== 1 || resultStatus.deletedCount < resultStatus.n) {
		const failedFileIds = await dbFindOperation(context.userId, '_id');
		resultStatus.failedFileIds = extractIds(failedFileIds);
		const error = new BadRequest('Incomple deletions:', resultStatus);
		context.errors.push(error);
	}
};

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

/**
 * @param {BSON|BSONString} userId
 * @param {object} context
 */
const deletePersonalFiles = async (context) => {
	try {
		const { userId } = context;
		const files = await repo.findPersonalFiles(userId);

		// Todo: Use repos instead of models
		const user = await userModel.findById(userId).exec();
		const school = await schoolModel.findById(user._id).exec();

		await repo.moveFilesToTrash(extractStorageIds(files), school);

		const resultStatus = await repo.deleteFilesByIDs(extractIds(files));
		resultStatus.type = 'deleted';
		await handleIncompleteDeleteOperations(resultStatus, context, repo.findPersonalFiles);

		context.deleted = [...context.deleted, ...files];
	} catch (err) {
		const error = new Unprocessable('Can not deleted personal files.', err);
		context.errors.push(error);
	}
};
/*
const replaceUserId = async (userId) => {
	// get UserId
	// search school tombstone
	// owner
	// creator
	// permissions
};
*/

/*
const setS3ExperiedForFileIds = async (fileIds) => {

}
*/

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
