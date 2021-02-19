const repo = require('../../repo/files.repo');

const { moveFilesToTrash } = require('./fileStorageProvider');

const { facadeLocator } = require('../../../../utils/facadeLocator');

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

	const userFacade = facadeLocator.facade('/users/v2');
	const schoolId = userFacade.getSchoolIdOfUser(userId);

	const complete =
		(await repo.removePersonalFilesByUserId(userId)) && (await moveFilesToTrash(schoolId, personalFileIds));

	return { trashBinData, complete };
};

module.exports = {
	removePersonalFiles,
};
