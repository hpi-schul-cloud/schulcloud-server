const { FileModel } = require('./db');

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

module.exports = {
	removeFilePermissionsByUserId,
};
