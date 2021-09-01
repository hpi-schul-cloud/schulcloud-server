const { FileModel } = require('./db');
const { AssertionError } = require('../../../errors');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { missingParameters } = require('../../../errors/assertionErrorHelper');
const { updateManyResult } = require('../../helper/repo.helper');

const isNotDeletedQuery = () => {
	const andQuery = {
		deletedAt: {
			$exists: false,
		},
	};
	return andQuery;
};

const isDeletedQuery = () => {
	const andQuery = {
		deletedAt: {
			$exists: true,
		},
	};
	return andQuery;
};

/**
 *
 * @param {Date} date
 * @returns
 */
const isDeletedSinceQuery = (date) => {
	const andQuery = {
		deletedAt: {
			$and: [
				{
					$exists: true,
				},
				{
					$lte: date,
				},
			],
		},
	};
	return andQuery;
};

const permissionSearchBaseQuery = (userId) => ({
	permissions: {
		$elemMatch: {
			refId: userId,
		},
	},
});

const byUserBaseQuery = (userId) => ({
	// TODO integrate not deleted here?
	refOwnerModel: 'user',
	owner: userId,
});

const notDeletedFilesByUserQuery = (userId) => ({ $and: [byUserBaseQuery(userId), isNotDeletedQuery] });

const notDeletedFilesByUserPermissionQuery = (userId) => ({
	$and: [permissionSearchBaseQuery(userId), isNotDeletedQuery],
});

const getFileById = async (id) => FileModel.findById(id).lean().exec();

/**
 * @param {BSON|BSONString} userId
 * @return {data} personal files of the user
 */
const getPersonalFilesByUserId = async (userId) => {
	if (!isValidObjectId(userId)) {
		throw new AssertionError(missingParameters({ userId }));
	}
	const query = notDeletedFilesByUserQuery(userId);
	return FileModel.find(query).lean().exec();
};

/**
 * @param {BSON|BSONString} userId
 * @return {boolean} success
 */
const removePersonalFilesByUserId = async (userId) => {
	if (!isValidObjectId(userId)) {
		throw new AssertionError(missingParameters({ userId }));
	}
	const query = notDeletedFilesByUserQuery(userId);
	const deleteResult = await FileModel.deleteMany(query).lean().exec();
	const { success } = updateManyResult(deleteResult);
	return success;
};

/**
 * @param {BSON|BSONString} userId
 * @return {data} filePermissions
 */
const getFilesWithUserPermissionsByUserId = async (userId) => {
	const query = notDeletedFilesByUserPermissionQuery(userId);
	return FileModel.aggregate([
		{
			$match: query,
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
 * @param {BSON|BSONString} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	if (!isValidObjectId(userId)) {
		throw new AssertionError(missingParameters({ userId }));
	}
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(permissionSearchBaseQuery(userId), updateQuery).lean().exec();
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
