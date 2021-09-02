const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { AssertionError } = require('../../../errors');

const fileStorageProviderRepo = require('../repo/fileStorageProvider.repo');
const filesRepo = require('../repo/files.repo');

const { facadeLocator } = require('../../../utils/facadeLocator');

const { trashBinResult } = require('../../helper/uc.helper');

const storageBucketName = (schoolId) => `bucket-${schoolId}`;

const decryptAccessKey = (secretAccessKey) => {
	const S3_KEY = Configuration.get('S3_KEY');
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
};

const getStorageProvider = async (storageProviderId) => {
	const storageProvider = await fileStorageProviderRepo.getStorageProviderMetaInformation(storageProviderId);
	if (storageProvider) storageProvider.secretAccessKey = decryptAccessKey(storageProvider.secretAccessKey);
	return storageProvider;
};

/**
 * Delete file connections for files shared with user
 * @param {BSON|BSONString} userId
 */
const removePermissionsThatUserCanAccess = async (userId) => {
	const [data, complete] = await Promise.all([
		filesRepo.getFilesWithUserPermissionsByUserId(userId),
		filesRepo.removeFilePermissionsByUserId(userId),
	]);

	return trashBinResult({ scope: 'filePermission', data, complete });
};

/**
 * Delete personal files from the given user
 * @param {BSON|BSONString} userId
 */
const removePersonalFiles = async (userId) => {
	const personalFiles = await filesRepo.getPersonalFilesByUserId(userId);
	const personalFileIds = personalFiles.map((file) => file._id);
	const trashBinData = {
		scope: 'files',
		data: personalFileIds,
	};
	if (personalFiles.length === 0) {
		return { trashBinData, complete: true };
	}
	const storageFileNames = personalFiles.map((file) => file.storageFileName);

	// ToDo: facade call is not needed once the context is available and the user is already stored there.
	const userFacade = facadeLocator.facade('/users/v2');
	const schoolId = await userFacade.getSchoolIdOfUser(userId);

	const schoolFacade = facadeLocator.facade('school/v2');
	const storageProviderId = await schoolFacade.getStorageProviderIdForSchool(schoolId);
	if (!storageProviderId) {
		throw new AssertionError(
			`The user ${userId} had private files, but for the school ${schoolId} is no storage provider assigned.`
		);
	}

	const storageProvider = await getStorageProvider(storageProviderId);
	const bucket = storageBucketName(schoolId);

	const complete = (
		await Promise.all([
			filesRepo.removePersonalFilesByUserId(userId),
			fileStorageProviderRepo.moveFilesToTrashBatch(storageProvider, bucket, storageFileNames),
		])
	).every(Boolean);

	return { trashBinData, complete };
};

const deleteExpiredData = async (backupPeriodThreshold) => {
	const userFacade = facadeLocator.facade('users/v2');
	const filesToBeDeleted = await userFacade.getExpiredTrashbinDataByScope('files', backupPeriodThreshold);
	for (const file of filesToBeDeleted) {
		try {
			const userId = file.refOwnerModel === 'user' && file.owner;
			if (!userId) {
				throw new AssertionError(`The file #{file._id.toString()} cannot be deleted, because the owner cannot be determined`);
			}
			const schoolId = await userFacade.getSchoolIdOfDeletedUser(userId);
			if (!schoolId) {
				throw new AssertionError(`The file #{file._id.toString()} cannot be deleted, because the school ID cannot be determined`);
			}
			const schoolFacade = facadeLocator.facade('school/v2');
			const storageProviderId = await schoolFacade.getStorageProviderIdForSchool(schoolId);
			const storageProvider = await getStorageProvider(storageProviderId);

			const bucketName = storageBucketName(schoolId);

			const fileName = `expiring_${file.storageFileName}`;

			await fileStorageProviderRepo.deleteFile(storageProvider, bucketName, fileName);
		} catch (error) {
			await userFacade.skipDeletionForTrashbinData(file.trashbinId);
		}
	}
};

const deleteUserData = [removePermissionsThatUserCanAccess, removePersonalFiles];

module.exports = {
	private: {
		removePermissionsThatUserCanAccess,
		removePersonalFiles,
	},
	deleteUserData,
	deleteExpiredData,
};
