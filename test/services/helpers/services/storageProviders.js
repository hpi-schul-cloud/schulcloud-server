const { StorageProviderModel } = require('../../../../src/services/storageProvider/model');

let createdProviderIds = [];

const removeManyProviders = (ids) =>
	StorageProviderModel.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();

const createTestProvider = (appPromise) => async ({
	// required fields for base group
	type = 'S3',
	isShared = true,
	accessKeyId = '123456789',
	secretAccessKey = '123456789',
	endpointUrl = 'http://example.org',
	region = 'eu-de',
	maxBuckets = 200,
	freeBuckets = 200,
} = {}) => {
	const app = await appPromise;
	const provider = await app.service('storageProvider').create({
		// required fields for user
		type,
		isShared,
		accessKeyId,
		secretAccessKey,
		endpointUrl,
		region,
		maxBuckets,
		freeBuckets,
	});
	createdProviderIds.push(provider._id.toString());
	return provider;
};

const cleanup = () => {
	if (createdProviderIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdProviderIds;
	createdProviderIds = [];
	return removeManyProviders(ids);
};

module.exports = (app) => ({
	create: createTestProvider(app),
	cleanup,
	info: createdProviderIds,
});
