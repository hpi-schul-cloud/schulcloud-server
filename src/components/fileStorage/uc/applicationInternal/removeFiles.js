const repo = require('../../repo/files.repo');

const getFileStorageStrategy = require('../../repo/strategies').createStrategy;

/**
 * Delete personal files from the given user
 * @param {BSON|BSONString} userId
 */
const removePersonalFiles = async (userId) => {
	const personalFiles = repo.getPersonalFilesByUserId(userId);
	const trashBinData = {
		scope: 'files',
		data: personalFiles,
	};

	const personalFileIds = personalFiles.map((file) => file._id);
	const storageType = 'awsS3'; // ToDo: get storage type from school of the given user
	const fileStorageStrategy = getFileStorageStrategy(storageType);

	const complete = fileStorageStrategy.moveFilesToTrash(personalFileIds) && repo.removePersonalFilesByUserId(userId);

	return { trashBinData, complete };
};

module.exports = {
	removePersonalFiles,
};
