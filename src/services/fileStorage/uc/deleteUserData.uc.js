const reqlib = require('app-root-path').require;

const { Unprocessable } = reqlib('src/errors');

const { BadRequest } = require('../../activation/utils/generalUtils');
const repo = require('../repo/files.repo');

// Todo: delete
const { userModel } = require('../../user/model');
const { schoolModel } = require('../../school/model');

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
 * @param {object} context
 */
const removePermissionsThatUserCanAccess = async (context) => {
	try {
		const { userId } = context;
		const files = await repo.findFilesThatUserCanAccess(userId);

		// filter information to delete
		const references = files.map(({ _id, permissions: p }) => {
			const permissions = p.filter(isUserPermission(userId));
			return { _id, permissions };
		});

		const resultStatus = await repo.removeFilePermissionsByUserId(extractIds(files), userId);
		resultStatus.type = 'references';
		await handleIncompleteDeleteOperations(resultStatus, context, repo.findFilesThatUserCanAccess);

		context.references = [...context.references, ...references];
	} catch (err) {
		const error = new Unprocessable('Can not remove file permissions.', err);
		context.errors.push(error);
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
	const context = {
		context: 'files',
		deleted: [],
		references: [],
		errors: [],
		userId,
	};

	// step 1
	await deletePersonalFiles(context);
	// step 2 -> Promise.all
	// await setS3ExperiedForFileIds(extractId(deletedFiles)); ..promise.all with removePermissionsThatUserCanAccess
	await removePermissionsThatUserCanAccess(context);
	// const replaceUserIds = await replaceUserId(userId); - step 2 or step 3

	return context;
};

module.exports = {
	deleteUserData,
};
