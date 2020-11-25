const { FileModel } = require('../model');
const createCorrectStrategy = require('../utils/createCorrectStrategy');
/**
 * user based database operations for files
 */

const lengthValidation = (result, fileIds) => {
	if (fileIds.length > result.n) {
		result.ok = 0;
	}
	return result;
};

/**
 * Permission based search
 * @param {BSON|BSONString} userId
 * @param {string|array|object} [select]
 */
const findFilesThatUserCanAccess = async (userId, select) => {
	const insideOfPermissions = {
		permissions: { $elemMatch: { refPermModel: 'user', refId: userId } },
	};

	const result = await FileModel.find(insideOfPermissions, select).lean().exec();
	return result;
};

/**
 * @param {*} fileIds
 * @return {MongooseBatchResult}
 */
const deleteFilesByIDs = async (fileIds = []) => {
	const result = await FileModel.deleteMany({ _id: { $in: fileIds } });
	return lengthValidation(result, fileIds);
};

/**
 * @param {BSON|BSONString} userId
 * @param {string|array|object} [select]
 */
const findPersonalFiles = async (userId, select) => {
	const query = {
		refOwnerModel: 'user',
		creator: userId,
		owner: userId,
	};

	const result = await FileModel.find(query, select).lean().exec();
	return result;
};

/**
 * @param {*} fileIds
 * @param {*} userId
 * @return {MongooseBatchResult}
 */
const removeFilePermissionsByUserId = async (fileIds = [], userId) => {
	const query = { _id: { $in: fileIds } };
	const $pull = { permissions: { refId: userId } };
	const result = await FileModel.updateMany(query, { $pull }).lean().exec();
	return lengthValidation(result, fileIds);
};

const moveFilesToTrash = (fileIds = [], school) => {
	const storageStrategy = createCorrectStrategy(school.fileStorageType)
	storageStrategy.moveFilesToTrash(school._id, fileIds);
};

module.exports = {
	findFilesThatUserCanAccess,
	deleteFilesByIDs,
	findPersonalFiles,
	removeFilePermissionsByUserId,
	moveFilesToTrash,
};
