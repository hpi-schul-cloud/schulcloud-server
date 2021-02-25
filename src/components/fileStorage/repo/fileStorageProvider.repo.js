import aws from 'aws-sdk';
import { Configuration } from '@hpi-schul-cloud/commons';
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

const getStorageProviderMetaInformation = async (storageProviderId) => {
	return StorageProviderModel.findById(storageProviderId).lean().exec();
};

const createStorageProviderInstance = (storageProviderMetaInformation) =>
	new aws.S3(getConfig(storageProviderMetaInformation));

const createCopyParams = (bucket, fileId) => {
	return {
		Bucket: bucket,
		CopySource: `/${bucket}/${fileId}`,
		Key: `expiring_${fileId}`,
		MetadataDirective: 'REPLACE',
		Metadata: {
			expires: 'true',
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

const moveFilesToTrash = async (storageProvider, bucket, fileIds) => {
	const requestLimit = Configuration.get('REQUEST_LIMIT_STORAGE_PROVIDER');
	for (let processedFiles = 0; processedFiles < fileIds.length; processedFiles += requestLimit) {
		const fileIdSubset = fileIds.slice(processedFiles, processedFiles + requestLimit);

		const storageProviderInstance = createStorageProviderInstance(storageProvider);

		// eslint-disable-next-line no-await-in-loop
		await Promise.all(
			fileIdSubset.map((fileId) => {
				const copyParams = createCopyParams(bucket, fileId);
				return storageProviderInstance.copyObject(copyParams).promise();
			})
		);

		const deleteParams = createDeleteParams(bucket, fileIdSubset);
		// eslint-disable-next-line no-await-in-loop
		await storageProviderInstance.deleteObjects(deleteParams).promise();
	}
	return true;
};

module.exports = {
	private: {
		createStorageProviderInstance,
	},
	getStorageProviderMetaInformation,
	moveFilesToTrash,
};
