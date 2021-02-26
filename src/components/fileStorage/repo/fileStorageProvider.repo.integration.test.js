const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const { expect } = require('chai');
const { fileStorageProviderRepo } = require('.');

describe('fileStorageProvider.repo.integration.test', () => {
	let server;
	let app;
	let configBefore;

	const storageProviderInfo = {
		accessKeyId: 'minioadmin',
		secretAccessKey: 'minioadmin',
		region: 'eu-west-1',
		endpointUrl: 'http://localhost:9090',
	};

	const cleanupStorageProvider = async (bucketName, fileId) => {
			await storageProvider.deleteObject({ Bucket: bucketName, Key: fileId }).promise();
			await storageProvider.deleteBucket({ Bucket: bucketName }).promise();
	}

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		app = await appPromise;
		Configuration.set('S3_KEY', 'abcdefghijklmnop');
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
		it('should not throw an error', () => {
			expect(() => fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo)).to.not.throw();
		});
	});

	/**
	 * This integration test requires MinIO running with the default configuration.
	 * If MinIO is not available under the default endpoint url, this test will be skipped.
	 */
	describe('moveFilesToTrash', () => {
		it('should mark objects as to be deleted under a prefixed name', async function () {
			const bucketName = `bucket-${testObjects.generateObjectId()}`;
			const fileId = testObjects.generateObjectId().toString();
			const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			try {
				await storageProvider.createBucket({ Bucket: bucketName }).promise();
			} catch (err) {
				if (err.code === 'UnknownEndpoint') this.skip(); // minio is not running
			}
			await storageProvider
				.upload({
					Bucket: bucketName,
					Key: fileId,
					Body: 'test',
				})
				.promise();

			const result = await fileStorageProviderRepo.moveFilesToTrash(storageProviderInfo, bucketName, [fileId]);

			expect(result).to.eq(true);

			const fileStorageContent = await storageProvider.listObjectsV2({ Bucket: bucketName }).promise();

			const newFileId = `expiring_${fileId}`;
			expect(fileStorageContent.Contents).to.be.an('array').of.length(1);
			expect(fileStorageContent.Contents[0].Key).to.eq(newFileId);

			const modifiedFile = await storageProvider.headObject({ Bucket: bucketName, Key: newFileId }).promise();

			expect(modifiedFile.Metadata.expires).to.eq('true');

			await cleanupStorageProvider(bucketName, newFileId);
		});
	});
});
