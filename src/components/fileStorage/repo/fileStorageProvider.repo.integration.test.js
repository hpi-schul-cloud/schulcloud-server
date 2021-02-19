const { Configuration } = require('@hpi-schul-cloud/commons');

const { expect } = require('chai');
const { fileStorageProviderRepo } = require('.');

describe('fileStorageProvider.repo.integration.test', () => {
	let testObjects;
	let server;
	let app;
	let configBefore;

	before(async () => {
		/* eslint-disable global-require */
		configBefore = Configuration.toObject(); // deep copy current config
		app = await require('../../../app');
		testObjects = require('../../../../test/services/helpers/testObjects')(app);
		Configuration.set('S3_KEY', 'abcdefghijklmnop');
		/* eslint-enable global-require */
		server = await app.listen(0);
	});

	after(async () => {
		Configuration.parse(configBefore);
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('createStorageProviderInstance', () => {
		it('should not throw an error', async () => {
			const storageProviderInfo = {
				accessKeyId: 'minioadmin',
				secretAccessKey: 'minioadmin',
				region: 'eu-west-1',
				endpointUrl: 'http://localhost:9090',
			};
			expect(() => fileStorageProviderRepo.createStorageProviderInstance(storageProviderInfo)).to.not.throw();
		});
	});
	describe('getLeastUsedStorageProvider', () => {
		it('should return the storage provider with the most free buckets', async () => {
			const leastUsedStorageProvider = await testObjects.createTestStorageProvider({ isShared: true, freeBuckets: 10 });
			await Promise.all(
				Array(10)
					.fill()
					.map((_, i) => testObjects.createTestStorageProvider({ isShared: true, freeBuckets: i }))
			);

			const result = await fileStorageProviderRepo.getLeastUsedStorageProvider();

			expect(result._id.toString()).to.eq(leastUsedStorageProvider._id.toString());
		});

		// it('should not return unshared storage provider', async () => {
		// 	await testObjects.createTestStorageProvider({ isShared: false, freeBuckets: 10 });
		// 	const sharedStorageProvider = await testObjects.createTestStorageProvider({ isShared: true, freeBuckets: 1 });

		// 	const result = await fileStorageProviderRepo.getLeastUsedStorageProvider();

		// 	expect(result._id.toString()).to.eq(sharedStorageProvider._id.toString());
		// });
	});
});
