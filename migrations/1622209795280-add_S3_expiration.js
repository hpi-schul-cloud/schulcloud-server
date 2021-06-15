const { alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { StorageProviderModel } = require('../src/components/fileStorage/repo/db');
const fileStorageProviderRepo = require('../src/components/fileStorage/repo/fileStorageProvider.repo');

const setBucketLifecycleConfiguration = (storageProvider, bucketName) =>
	storageProvider
		.putBucketLifecycleConfiguration({
			Bucket: bucketName,
			LifecycleConfiguration: {
				Rules: [
					{
						Prefix: 'expiring_',
						Expiration: {
							Days: 7,
						},
						Status: 'Enabled',
					},
				],
			},
		})
		.promise();

const removeBucketLifecycleConfiguration = (storageProvider, bucketName) =>
	storageProvider
		.deleteBucketLifecycle({
			Bucket: bucketName,
		})
		.promise();

module.exports = {
	up: async () => {
		alert('start migration');
		await connect();
		const storageProviderInfos = await StorageProviderModel.find({}).lean().exec();
		alert(`${storageProviderInfos.length} storage providers found`);
		for (const storageProviderInfo of storageProviderInfos) {
			const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			// eslint-disable-next-line no-await-in-loop
			const buckets = await storageProvider.listBuckets().promise();
			alert(`${buckets.Buckets.length} buckets found in storage provider`);
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(buckets.Buckets.map((bucket) => setBucketLifecycleConfiguration(storageProvider, bucket.Name)));
		}
		alert('done!');
		await close();
	},

	down: async () => {
		alert('start migration');
		await connect();
		const storageProviderInfos = await StorageProviderModel.find({}).lean().exec();
		alert(`${storageProviderInfos.length} storage providers found`);
		for (const storageProviderInfo of storageProviderInfos) {
			const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			// eslint-disable-next-line no-await-in-loop
			const buckets = await storageProvider.listBuckets().promise();
			alert(`${buckets.Buckets.length} buckets found in storage provider`);
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(
				buckets.Buckets.map((bucket) => removeBucketLifecycleConfiguration(storageProvider, bucket.Name))
			);
		}
		alert('done!');
		await close();
	},
};
