const { FileModel } = require('./db');
const { AssertionError } = require('../../../errors');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { missingParameters } = require('../../../errors/assertionErrorHelper');
const { updateManyResult } = require('../../helper/repo.helper');

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
 * @param {BSON|BSONString} userId
 * @return {data} personal files of the user
 */
const getPersonalFilesByUserId = async (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(missingParameters({ userId }));
	return FileModel.find(personalFileSearchQuery(userId)).lean().exec();
};

/**
 * @param {BSON|BSONString} userId
 * @return {boolean} success
 */
const removePersonalFilesByUserId = async (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(missingParameters({ userId }));
	const deleteResult = await FileModel.deleteMany(personalFileSearchQuery(userId)).lean().exec();
	const { success } = updateManyResult(deleteResult);
	return success;
};

/**
 * @param {BSON|BSONString} userId
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
 * @param {BSON|BSONString} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	if (!isValidObjectId(userId)) throw new AssertionError(missingParameters({ userId }));
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
