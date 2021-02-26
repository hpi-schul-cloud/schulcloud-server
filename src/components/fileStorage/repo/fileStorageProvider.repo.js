import aws from 'aws-sdk';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AssertionError } from '../../../errors';
import { StorageProviderModel } from './db';

const HOST = Configuration.get('HOST');

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		cors_rules: {
			AllowedHeaders: ['*'],
			AllowedMethods: ['PUT'],
			AllowedOrigins: [HOST],
			MaxAgeSeconds: 300,
		},
	});
	awsConfig.endpoint = new aws.Endpoint(provider.endpointUrl);
	return awsConfig;
};

const getStorageProviderMetaInformation = async (storageProviderId) =>
	StorageProviderModel.findById(storageProviderId).lean().exec();

const createStorageProviderInstance = (storageProviderMetaInformation) =>
	new aws.S3(getConfig(storageProviderMetaInformation));

const createCopyParams = (bucket, fileId) => ({
	Bucket: bucket,
	CopySource: `/${bucket}/${fileId}`,
	Key: `expiring_${fileId}`,
	MetadataDirective: 'REPLACE',
	Metadata: {
		expires: 'true',
	},
});

const createDeleteParams = (bucket, fileIds) => ({
	Bucket: bucket,
	Delete: {
		Objects: fileIds.map((fileId) => ({
			Key: fileId,
		})),
	},
});


/**
 * Marks the files in the storage provider as to be deleted.
 * This function can only handle up to 1000 file IDs at once.
 * @param {*} storageProvider storage provider of the files that should be deleted
 * @param {*} bucket bucket name of the file that should be deleted
 * @param {*} fileIds IDs of the files that should be deleted
 */
const moveFilesToTrash = async (storageProvider, bucket, fileIds) => {
	if (fileIds.length > 1000) {
		throw AssertionError('Only up to 1000 files can be deleted with one storage provider request');
	}
	const storageProviderInstance = createStorageProviderInstance(storageProvider);

	await Promise.all(
		fileIds.map((fileId) => {
			const copyParams = createCopyParams(bucket, fileId);
			return storageProviderInstance.copyObject(copyParams).promise();
		})
	);
	const deleteParams = createDeleteParams(bucket, fileIds);
	await storageProviderInstance.deleteObjects(deleteParams).promise();
};

/**
 * Marks the files in the storage provider as to be deleted.
 * If the batch operation was successful it returns true, otherwise an error is thrown
 * @param {*} storageProvider storage provider of the files that should be deleted
 * @param {*} bucket bucket name of the file that should be deleted
 * @param {*} fileIds IDs of the files that should be deleted
 */
const moveFilesToTrashBatch = async (storageProvider, bucket, fileIds) => {
	const requestLimit = Configuration.get('REQUEST_LIMIT_STORAGE_PROVIDER');
	for (let processedFiles = 0; processedFiles < fileIds.length; processedFiles += requestLimit) {
		const fileIdSubset = fileIds.slice(processedFiles, processedFiles + requestLimit);
		// eslint-disable-next-line no-await-in-loop
		await moveFilesToTrash(storageProvider, bucket, fileIdSubset);
	}
	return true;
};

module.exports = {
	private: {
		createStorageProviderInstance,
	},
	getStorageProviderMetaInformation,
	moveFilesToTrash: moveFilesToTrashBatch,
};
