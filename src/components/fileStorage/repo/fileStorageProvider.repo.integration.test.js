const { Configuration } = require('@hpi-schul-cloud/commons');

const { expect } = require('chai');
const { fileStorageProviderRepo } = require('.');

describe('fileStorageProvider.repo.integration.test', () => {
	let testObjects;
	let server;
	let app;
	let configBefore;

	const storageProviderInfo = {
		accessKeyId: 'minioadmin',
		secretAccessKey: 'minioadmin',
		region: 'eu-west-1',
		endpointUrl: 'http://localhost:9090',
	};

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
			expect(() => fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo)).to.not.throw();
		});
	});

	describe('moveFilesToTrash', () => {
		it('should mark objects as to be deleted under a prefixed name', async () => {
			const bucketName = `bucket-${testObjects.generateObjectId()}`;
			const fileId = testObjects.generateObjectId().toString();
			const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			await storageProvider.createBucket({ Bucket: bucketName }).promise();
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

			await storageProvider.deleteObject({ Bucket: bucketName, Key: newFileId }).promise();
			await storageProvider.deleteBucket({ Bucket: bucketName }).promise();
		});
	});
});
