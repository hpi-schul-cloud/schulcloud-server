const aws = require('aws-sdk');

const { Configuration } = require('@hpi-schul-cloud/commons');

const HOST = Configuration.get('HOST');

const getCorsRules = () => [
	{
		AllowedHeaders: ['*'],
		AllowedMethods: ['PUT'],
		AllowedOrigins: [HOST],
		MaxAgeSeconds: 300,
	},
];

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		endpointUrl: provider.endpointUrl,
		cors_rules: getCorsRules(),
	});
	awsConfig.endpoint = new aws.Endpoint(provider.endpointUrl);
	return awsConfig;
};

const createStorageProviderInstance = async (storageProvider) => {
	return new aws.S3(getConfig(storageProvider));
};

const deleteObjects = (storageProvider, params) => {
	const storageProviderInstance = createStorageProviderInstance(storageProvider);
	return storageProviderInstance.deleteObjects(params).promise();
};

const copyObject = (storageProvider, params) => {
	const storageProviderInstance = createStorageProviderInstance(storageProvider);
	return storageProviderInstance.copyObject(params).promise();
};

module.exports = { deleteObjects, copyObject };
