const { FileModel } = require('./db');

const searchQuery = (userId) => ({
	permissions: {
		$elemMatch: {
			refId: userId,
		}
	}
});

const getFileById = async (id) => FileModel.findById(id).lean().exec();

/**
 * @param {*} userId
 * @return {data} filePermissions
 */
const getFilesWithUserPermissionsByUserId = async (userId) => {
	return FileModel.aggregate([
		{
			$match: searchQuery(userId),
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
};

/**
 * @param {*} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(searchQuery(userId), updateQuery).lean().exec();
	const success = result.ok === 1 && result.n === result.nModified;
	return success;
};

module.exports = {
	getFileById,
	getFilesWithUserPermissionsByUserId,
	removeFilePermissionsByUserId,
};
