const { FileModel } = require('./db');
const { createStrategy } = require('./strategies');

/**
 * Permission based search
 * @param {BSON|BSONString} userId
 * @param {string|array|object} [select]
 */
const findFilesThatUserCanAccess = async (userId, select) => {
	const insideOfPermissions = {
		permissions: { $elemMatch: { refPermModel: 'user', refId: userId } },
		owner: { $ne: userId },
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
	const success = result.ok === 1 && result.n === result.nModified && fileIds.length === result.n;
	return { fileIds, success };
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
const removeFilePermissionsByUserId = async (userId) => {
	const searchQuery = { permissions: { $elemMatch: { refId: userId } } };

	const filePermissions = await FileModel.aggregate([
		{
			$match: {
				permissions: {
					$elemMatch: { refId: userId },
				},
			},
		},
		{
			$project: {
				_id: 1,
				permissions: {
					$filter: {
						input: '$permissions',
						as: 'permission',
						cond: { $eq: ['$$permission.refId', userId] },
					},
				},
			},
		},
	]);

	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(searchQuery, updateQuery).lean().exec();
	const success = result.ok === 1 && result.n === result.nModified && filePermissions.length === result.n;
	return { filePermissions, success };
};

const moveFilesToTrash = (fileIds = [], school) => {
	const storageStrategy = createStrategy(school.fileStorageType);
	storageStrategy.moveFilesToTrash(school._id, fileIds);
};

module.exports = {
	findFilesThatUserCanAccess,
	deleteFilesByIDs,
	findPersonalFiles,
	removeFilePermissionsByUserId,
	moveFilesToTrash,
};
