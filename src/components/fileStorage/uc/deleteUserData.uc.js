const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');

const fileStorageProviderRepo = require('../repo/fileStorageProvider.repo');
const filesRepo = require('../repo/files.repo');

const { facadeLocator } = require('../../../utils/facadeLocator');

const { trashBinResult } = require('../../helper/uc.helper');


const storageBucketName = (schoolId) => `bucket-${schoolId}`;

const decryptAccessKey = async (secretAccessKey) => {
	const S3_KEY = Configuration.get('S3_KEY');
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
};

const getStorageProvider = async (storageProviderId) => {
	const storageProvider = await fileStorageProviderRepo.getStorageProviderMetaInformation(storageProviderId);
	storageProvider.secretAccessKey = await decryptAccessKey(storageProvider.secretAccessKey);
	return storageProvider;
};

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const data = await filesRepo.getFilesWithUserPermissionsByUserId(userId);
	const complete = await filesRepo.removeFilePermissionsByUserId(userId);

	return trashBinResult({ scope: 'filePermission', data, complete });
};

/**
 * Delete personal files from the given user
 * @param {BSON|BSONString} userId
 */
const removePersonalFiles = async (userId) => {
	const personalFiles = filesRepo.getPersonalFilesByUserId(userId);
	const trashBinData = {
		scope: 'files',
		data: personalFiles,
	};
	const personalFileIds = personalFiles.map((file) => file._id);

	const userFacade = facadeLocator.facade('/users/v2');
	const schoolId = userFacade.getSchoolIdOfUser(userId);

	const schoolFacade = facadeLocator.facade('school/v2');
	const school = await schoolFacade.getSchool(schoolId);
	const storageProvider = await getStorageProvider(school.storageProvider, school._id);
	const bucket = storageBucketName(schoolId);

	const complete = Promise.all([
		filesRepo.removePersonalFilesByUserId(userId),
		fileStorageProviderRepo.moveFilesToTrash(storageProvider, bucket, personalFileIds),
	]).every(Boolean);

	return { trashBinData, complete };
};

const deleteUserData = [removePermissionsThatUserCanAccess, removePersonalFiles];

module.exports = {
	private: {
		removePermissionsThatUserCanAccess,
		removePersonalFiles,
	},
	deleteUserData,
};
