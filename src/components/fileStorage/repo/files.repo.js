const { FileModel } = require('./db');
const { updateManyResult } = require('../../helper/repo.helper');
const { validateObjectId } = require('../../helper/uc.helper');

const permissionSearchQuery = (userId) => ({
	permissions: {
		$elemMatch: {
			refId: userId,
		},
	},
});

const personalFileSearchQuery = (userId) => ({
	refOwnerModel: 'user',
	owner: userId,
});

const getFileById = async (id) => FileModel.findById(id).lean().exec();

/**
 * @param {*} userId
 * @return {data} personal files of the user
 */
const getPersonalFilesByUserId = async (userId) => {
	validateObjectId(userId);
	return FileModel.find(personalFileSearchQuery(userId)).lean().exec();
};

/**
 * @param {*} userId
 * @return {boolean} success
 */
const removePersonalFilesByUserId = async (userId) => {
	validateObjectId(userId);
	const deleteResult = await FileModel.deleteMany(personalFileSearchQuery(userId)).lean().exec();
	const { success } = updateManyResult(deleteResult);
	return success;
}

/**
 * @param {*} userId
 * @return {data} filePermissions
 */
const getFilesWithUserPermissionsByUserId = async (userId) =>
	FileModel.aggregate([
		{
			$match: permissionSearchQuery(userId),
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
	validateObjectId(userId);
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(permissionSearchQuery(userId), updateQuery).lean().exec();
	const { success } = updateManyResult(result);
	return success;
};

module.exports = {
	getFileById,
	getPersonalFilesByUserId,
	removePersonalFilesByUserId,
	getFilesWithUserPermissionsByUserId,
	removeFilePermissionsByUserId,
};
