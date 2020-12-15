const { FileModel } = require('./db');
const { ValidationError } = require('../../../errors');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { updateManyResult } = require('../../helper/repo.helper');

const searchQuery = (userId) => ({
	permissions: {
		$elemMatch: {
			refId: userId,
		},
	},
});

const getFileById = async (id) => FileModel.findById(id).lean().exec();

/**
 * @param {*} userId
 * @return {data} filePermissions
 */
const getFilesWithUserPermissionsByUserId = async (userId) =>
	FileModel.aggregate([
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

/**
 * @param {*} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	if (!isValidObjectId(userId)) throw new ValidationError(`${userId} is not a valid objectId`);
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(searchQuery(userId), updateQuery).lean().exec();
	const { success } = updateManyResult(result);
	return success;
};

module.exports = {
	getFileById,
	getFilesWithUserPermissionsByUserId,
	removeFilePermissionsByUserId,
};
