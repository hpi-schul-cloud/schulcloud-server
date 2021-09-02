const { FileModel } = require('./db');
const { AssertionError } = require('../../../errors');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { missingParameters } = require('../../../errors/assertionErrorHelper');
const { updateManyResult } = require('../../helper/repo.helper');
const { NotFound } = require('../../../errors');

const isNotDeletedQuery = {
	deletedAt: {
		$exists: false,
	},
};

/**
 * TODO integrate
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
	refOwnerModel: 'user',
	owner: userId,
});

const notDeletedFileByFileId = (fileId) => ({ $and: [{ _id: fileId }, isNotDeletedQuery] });

const notDeletedFilesByUserQuery = (userId) => ({ $and: [byUserBaseQuery(userId), isNotDeletedQuery] });

const notDeletedFilesByUserPermissionQuery = (userId) => ({
	$and: [permissionSearchBaseQuery(userId), isNotDeletedQuery],
});

/**
 * returns not deleted file by id, throws not found
 * @param {*} id
 * @returns
 */
const getFileById = async (id) => {
	const file = await FileModel.findOne(notDeletedFileByFileId(id)).lean().exec();
	if (file == null) {
		throw new NotFound();
	}
	return file;
};

/**
 * resolves all files including deleted ones
 * @param {*} id
 * @returns
 */
const getFileOrDeletedFileById = async (id) => FileModel.findById(id).lean().exec();

const removeFileById = async (id) => FileModel.findByIdAndUpdate(id, { deletedAt: new Date() });

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
	const currentDate = new Date();
	const deleteResult = await FileModel.updateMany(query, { deletedAt: currentDate }).lean().exec();
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
 * removes users permissions on files for a given user
 * @param {BSON|BSONString} userId
 * @return {boolean} success
 */
const removeFilePermissionsByUserId = async (userId) => {
	if (!isValidObjectId(userId)) {
		throw new AssertionError(missingParameters({ userId }));
	}
	const updateQuery = { $pull: { permissions: { refId: userId } } };
	const result = await FileModel.updateMany(notDeletedFilesByUserPermissionQuery(userId), updateQuery).lean().exec();
	const { success } = updateManyResult(result);
	return success;
};

module.exports = {
	getPersonalFilesByUserId,
	removePersonalFilesByUserId,
	getFilesWithUserPermissionsByUserId,
	removeFileById,
	removeFilePermissionsByUserId,
	// only to be used for testing
	getFileById,
	getFileOrDeletedFileById,
};
