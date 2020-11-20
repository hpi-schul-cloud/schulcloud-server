const reqlib = require('app-root-path').require;

const { Unprocessable } = reqlib('src/errors');

const { BadRequest } = require('../../activation/utils/generalUtils');
const repo = require('../repo/files.repo');

const isUserPermission = (userId) => (p) => p.refId.toString() === userId.toString() && p.refPermModel === 'user';

const extractIds = (result = []) => result.map(({ _id }) => _id);

const handleIncompleteDeleteOperations = async (resultStatus, context, userId, dbFindOperation) => {
	if (resultStatus.ok !== 1 || resultStatus.deletedCount < resultStatus.n) {
		const failedFileIds = await dbFindOperation(userId, '_id');
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
const removePermissionsThatUserCanAccess = async (userId, context) => {
	try {
		const files = await repo.findFilesThatUserCanAccess(userId);

		// filter information to delete
		const references = files.map(({ _id, permissions: p }) => {
			const permissions = p.filter(isUserPermission(userId));
			return { _id, permissions };
		});

		const resultStatus = await repo.removeFilePermissionsByUserId(extractIds(files), userId);
		await handleIncompleteDeleteOperations(resultStatus, context, userId, repo.findFilesThatUserCanAccess);

		context.references = [...context.references, ...references];
	} catch (err) {
		throw new Unprocessable('Can not remove file permissions', err);
	}
};

/**
 * @param {BSON|BSONString} userId
 * @param {object} context
 */
const deletePersonalFiles = async (userId, context) => {
	try {
		const files = await repo.findPersonalFiles(userId);
		const resultStatus = await repo.deleteFilesByIDs(extractIds(files));

		await handleIncompleteDeleteOperations(resultStatus, context, userId, repo.findPersonalFiles);

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
	};

	await deletePersonalFiles(userId, context);
	// await setS3ExperiedForFileIds(extractId(deletedFiles)); ..promise.all with removePermissionsThatUserCanAccess
	await removePermissionsThatUserCanAccess(userId, context);
	// const replaceUserIds = await replaceUserId(userId);

	return context;
};

module.exports = {
	deleteUserData,
};
