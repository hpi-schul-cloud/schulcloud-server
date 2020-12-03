const { FileModel } = require('./db');

/**
 * @param {*} userId
 * @return {data} filePermissions
 */
const getFilePermissionsByUserId = async (userId) => {
	return FileModel.aggregate([
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
};

/**
 * @param {*} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	const searchQuery = { permissions: { $elemMatch: { refId: userId } } };
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(searchQuery, updateQuery).lean().exec();
	const success = result.ok === 1 && result.n === result.nModified;
	return success;
};

module.exports = {
	getFilePermissionsByUserId,
	removeFilePermissionsByUserId,
};
