const { FileModel } = require('../model');
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
 * @param {BSON || BSONString} userId
 */
const findFilesThatUserCanAccess = async (userId) => {
	const insideOfPermissions = {
		permissions: { $elemMatch: { refPermModel: 'user', refId: userId } },
	};

	const result = await FileModel.find(insideOfPermissions).lean().exec();
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

const findPersonalFiles = async (userId) => {
	const query = {
		refOwnerModel: 'user',
		creator: userId,
		owner: userId,
	};
	const result = await FileModel.find(query).lean().exec();
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

module.exports = {
	findFilesThatUserCanAccess,
	deleteFilesByIDs,
	findPersonalFiles,
	removeFilePermissionsByUserId,
};
