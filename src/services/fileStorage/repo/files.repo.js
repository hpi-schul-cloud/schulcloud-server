const { FileModel } = require('../model');
/**
 * user based database operations for files
 */

/**
 * Permission based search
 * @param {BSON || BSONString} userId
 */
const findFilesShardWithUserId = async (userId) => {
	const query = {
		permissions: { refPermModel: 'user', refId: userId },
	};
	const result = await FileModel.find(query).lean().exec();
	return result;
};

const deleteFilesByIDs = async (fileIds = []) => {
	const $or = fileIds.map((_id) => ({ _id }));
	const result = await FileModel.deleteMany({ $or });
	return result;
};

// TODO: discuss if repo should catch errors or only throw up
module.exports = {
	findFilesShardWithUserId,
	deleteFilesByIDs,
};
