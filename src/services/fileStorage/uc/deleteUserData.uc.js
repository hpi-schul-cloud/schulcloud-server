const reqlib = require('app-root-path').require;

const { Unprocessable } = reqlib('src/errors');

const { BadRequest } = require('../../activation/utils/generalUtils');
const repo = require('../repo/files.repo');

const isUserPermission = (userId) => (p) => p.refId.toString() === userId.toString() && p.refPermModel === 'user';
/**
 * Delete file connections for files shared with user
 * @param {BSON || BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	try {
		const result = await repo.findFilesThatUserCanAccess(userId);

		// format
		// null is valid response but should formated to array
		// format in a way that key relationship can restore
		// --> delta
		// repo operation for remove permission of user
		const references = result.map(({ _id, permissions: p }) => {
			const permissions = p.filter(isUserPermission(userId));
			return { _id, permissions };
		});

		const resultStatus = await repo.removeFilePermissionsByUserId();
		if (resultStatus.ok !== 1) {
			throw new BadRequest('Can not all file permissions from user.', resultStatus);
		}

		return {
			references, // [{ _id, permissions: [ {} ]} , { _id, permissions: [ {} ]}]
		};
	} catch (err) {
		throw new Unprocessable('Can not remove file permissions', err);
	}
};

const deletePersonalFiles = async (userId) => {
	try {
		const result = await repo.findPersonalFiles(userId);
		const ids = result.map(({ _id }) => _id);
		const resultStatus = await repo.deleteFilesByIDs(ids);
		if (resultStatus.ok !== 1) {
			throw new BadRequest('Can not delete all personal files', resultStatus);
		}
		return {
			deleted: result,
		};
	} catch (err) {
		throw new Unprocessable('Can not deleted personal files.', err);
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

	// TODO pass errors and do not throw OR pass context
	const deletedFiles = await deletePersonalFiles(userId);
	context.deleted = [...context.deleted, ...deletedFiles.deleted];
	// const fileIds = deletedFiles.map(({ _id }) => _id);
	// await setS3ExperiedForFileIds(fileIds); ..promise.all with removePermissionsThatUserCanAccess
	const removedPermissions = await removePermissionsThatUserCanAccess(userId);
	context.references = [...context.references, ...removedPermissions.references];
	// const replaceUserIds = await replaceUserId(userId);

	return context;
};

module.exports = {
	deleteUserData,
};
