const aws = require('aws-sdk');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { StorageProviderModel } = require('./db');

const HOST = Configuration.get('HOST');

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		endpointUrl: provider.endpointUrl,
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

const createStorageProviderInstance = (storageProviderMetaInformation) => {
	return new aws.S3(getConfig(storageProviderMetaInformation));
};

const deleteObjects = (storageProvider, params) => {
	const storageProviderInstance = createStorageProviderInstance(storageProvider);
	return storageProviderInstance.deleteObjects(params).promise();
};

const copyObject = (storageProvider, params) => {
	const storageProviderInstance = createStorageProviderInstance(storageProvider);
	return storageProviderInstance.copyObject(params).promise();
};

const createCopyParams = (bucket, fileId) => {
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

const moveFilesToTrash = async (storageProvider, bucket, fileIds) => {
	const parallelRequests = 100; // we can experiment with inc-/decreasing this. Max 1000 for the delete request
	for (let processedFiles = 0; processedFiles < fileIds.length; processedFiles += parallelRequests) {
		const fileIdSubset = fileIds.slice(processedFiles, processedFiles + parallelRequests);
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(
			fileIdSubset.map((fileId) => {
				const copyParams = createCopyParams(bucket, fileId);
				return copyObject(storageProvider, copyParams);
			})
		);

		const deleteParams = createDeleteParams(bucket, fileIdSubset);
		// eslint-disable-next-line no-await-in-loop
		await deleteObjects(storageProvider, deleteParams).promise();
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
