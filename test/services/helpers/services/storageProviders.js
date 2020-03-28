const storageProviderModel = require('../../../../src/services/storageProvider/model');

let createdProviderIds = [];
console.log(storageProviderModel);
const removeManyProviders = (ids) => storageProviderModel.deleteMany({ _id: { $in: ids } }).lean().exec();

const createTestProvider = (app, opt) => ({
	// required fields for base group
	type = 'S3',
	isShared = true,
	accessKeyId = '123456789',
	secretAccessKey = '123456789',
	endpointUrl = 'http://example.org',
	region = 'eu-de',
	maxBuckets = 200,
} = {}) => app.service('storageProvider').create({
	// required fields for user
	type,
	isShared,
	accessKeyId,
	secretAccessKey,
	endpointUrl,
	region,
	maxBuckets,
}).then((provider) => {
	createdProviderIds.push(provider._id.toString());
	return provider;
});

const cleanup = () => {
	if (createdProviderIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdProviderIds;
	createdProviderIds = [];
	return removeManyProviders(ids);
};

module.exports = (app, opt) => {
	return {
		create: createTestProvider(app, opt),
		cleanup,
		info: createdProviderIds,
	};
};
