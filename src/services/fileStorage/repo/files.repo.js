const { FileModel } = require('../model');
/**
 * user based database operations for files
 */

/**
 * Permission based search
 * @param {BSON || BSONString} userId
 */
const findFilesShardWithUserId = async (userId) => {
	const insideOfPermissions = {
		permissions: { $elemMatch: { refPermModel: 'user', refId: userId } },
	};
	const isNotOwner = {
		owner: { $ne: userId },
		refOwnerModel: { $ne: 'user' },
	};
	const $and = [insideOfPermissions, isNotOwner];

	const result = await FileModel.find({ $and }).lean().exec();
	return result;
};

const deleteFilesByIDs = async (fileIds = []) => {
	const result = await FileModel.deleteMany({ _id: { $in: fileIds } });
	return result;
};

// TODO: discuss if repo should catch errors or only throw up
module.exports = {
	findFilesShardWithUserId,
	deleteFilesByIDs,
};
