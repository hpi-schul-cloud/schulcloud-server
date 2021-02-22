const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');
const mongoose = require('mongoose'); // ToDo: Remove, currently used to initialize a session

const fileStorageProviderRepo = require('../../repo/fileStorageProvider.repo');

const { facadeLocator } = require('../../../../utils/facadeLocator');

const createCopyParamsToMarkAsBeingDeleted = (bucket, fileId) => {
	return {
		Bucket: bucket,
		CopySource: `/${bucket}/${fileId}`,
		Key: `expiring_${fileId}`,
		MetadataDirective: 'REPLACE',
		Metadata: {
			expires: true,
		},
	};
};

const createDeleteParams = (bucket, fileIds) => {
	return {
		Bucket: bucket,
		Delete: {
			Objects: fileIds.map((fileId) => ({
				Key: fileId,
			})),
		},
	};
};

const storageBucketName = (schoolId) => `bucket-${schoolId}`;

const chooseProvider = async (schoolId) => {
	let storageProvider;
	const session = await mongoose.startSession(); // ToDo: How to allign with new architecture
	await session.withTransaction(
		async () => {
			// We need to figure out if we run in a replicaset, because DB-calls with transaction
			// will fail if not run in a replicaset.
			const effectiveSession = session.clientOptions.replicaSet ? session : undefined;
			storageProvider = fileStorageProviderRepo.getLeastUsedStorageProvider(effectiveSession);

			const schoolFacade = facadeLocator.facade('school/v2');

			await Promise.all([
				fileStorageProviderRepo.decreaseFreeBuckets(storageProvider._id, effectiveSession),
				schoolFacade.setStorageProvider(schoolId, storageProvider._id, effectiveSession),
			]);
		},
		{ readPreference: 'primary' } // transactions will only work with readPreference = 'primary'
	);
	session.endSession();
	return storageProvider;
};

const decryptAccessKey = async (secretAccessKey) => {
	const S3_KEY = Configuration.get('S3_KEY');
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
};

const getStorageProvider = async (storageProviderId, schoolId) => {
	const storageProvider =
		(await fileStorageProviderRepo.getStorageProviderMetaInformation(storageProviderId)) ||
		(await chooseProvider(schoolId));
	storageProvider.secretAccessKey = await decryptAccessKey(storageProvider.secretAccessKey);
	return storageProvider;
};

const moveFilesToTrash = async (schoolId, fileIds) => {
	const schoolFacade = facadeLocator.facade('school/v2');
	const school = await schoolFacade.getSchool(schoolId);
	const storageProvider = await getStorageProvider(school.storageProvider, school._id);
	const bucket = storageBucketName(schoolId);

	const parallelRequests = 100; // we can experiment with inc-/decreasing this. Max 1000 for the delete request
	for (let processedFiles = 0; processedFiles < fileIds.length; processedFiles += parallelRequests) {
		const fileIdSubset = fileIds.slice(processedFiles, processedFiles + parallelRequests);
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(
			fileIdSubset.map((fileId) => {
				const copyParams = createCopyParamsToMarkAsBeingDeleted(bucket, fileId);
				return fileStorageProviderRepo.copyObject(storageProvider, copyParams);
			})
		);

		const deleteParams = createDeleteParams(bucket, fileIdSubset);
		// eslint-disable-next-line no-await-in-loop
		await fileStorageProviderRepo.deleteObjects(storageProvider, deleteParams).promise();
	}
	return true;
};

module.exports = { moveFilesToTrash };
