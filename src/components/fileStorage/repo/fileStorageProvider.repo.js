const aws = require('aws-sdk');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { StorageProviderModel } = require('./db');

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

const getStorageProviderMetaInformation = async (storageProviderId) => {
	return StorageProviderModel.findById(storageProviderId).lean().exec();
};

const getLeastUsedStorageProvider = async (session) => {
	const providers = await StorageProviderModel.find({ isShared: true })
		.sort({ freeBuckets: -1 })
		.limit(1)
		.session(session)
		.lean()
		.exec();

	if (!Array.isArray(providers) || providers.length === 0) throw new Error('No available provider found.');
	return providers[0];
};

const decreaseFreeBuckets = async (storageProviderId, session) => {
	return StorageProviderModel.findByIdAndUpdate(storageProviderId, { $inc: { freeBuckets: -1 } })
		.session(session)
		.lean()
		.exec();
};

const createStorageProviderInstance = async (storageProviderMetaInformation) => {
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

module.exports = {
	getStorageProviderMetaInformation,
	deleteObjects,
	copyObject,
	getLeastUsedStorageProvider,
	decreaseFreeBuckets,
};
