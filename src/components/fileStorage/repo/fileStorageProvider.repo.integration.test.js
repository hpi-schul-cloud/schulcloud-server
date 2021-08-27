const { Configuration } = require('@hpi-schul-cloud/commons');
const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const fileStorageProviderRepo = rewire('./fileStorageProvider.repo');

describe.only('fileStorageProvider.repo.integration.test', () => {
	let server;
	let app;
	let configBefore;

	const storageProviderInfo = {
		accessKeyId: 'minioadmin',
		secretAccessKey: 'minioadmin',
		region: 'eu-west-1',
		endpointUrl: 'http://localhost:9090',
	};

	const cleanupStorageProvider = async (storageProvider, bucketName, fileIds) => {
		const deleteParams = {
			Bucket: bucketName,
			Delete: {
				Objects: fileIds.map((fileId) => ({
					Key: `expiring_${fileId}`,
				})),
			},
		};
		await storageProvider.deleteObjects(deleteParams).promise();
		await storageProvider.deleteBucket({ Bucket: bucketName }).promise();
	};

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		app = await appPromise;
		Configuration.set('S3_KEY', 'abcdefghijklmnop');
		server = await app.listen(0);
	});

	after(async () => {
		Configuration.reset(configBefore);
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
	 * This integration tests requires MinIO running with the default configuration.
	 * If MinIO is not available under the default endpoint url, this test will be skipped.
	 */
	let skipMinioTests = false;

	describe('moveFilesToTrash', () => {
		beforeEach(function beforeEach() {
			if (skipMinioTests) {
				this.currentTest.fn = function skipFunction() {
					this.skip();
				};
			}
		});

		it('should mark objects as to be deleted under a prefixed name', async function testFunction() {
			const bucketName = `bucket-${testObjects.generateObjectId()}`;
			const fileId = testObjects.generateObjectId().toString();
			const storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			try {
				await storageProvider.createBucket({ Bucket: bucketName }).promise();
			} catch (err) {
				if (err.code === 'UnknownEndpoint') {
					skipMinioTests = true;
					this.skip(); // minio is not running
				}
			}
			await storageProvider
				.upload({
					Bucket: bucketName,
					Key: fileId,
					Body: 'test',
				})
				.promise();

			const result = await fileStorageProviderRepo.moveFilesToTrash(storageProviderInfo, bucketName, [fileId]);

			const fileStorageContent = await storageProvider.listObjectsV2({ Bucket: bucketName }).promise();

			const newFileId = `expiring_${fileId}`;
			expect(fileStorageContent.Contents).to.be.an('array').of.length(1);
			expect(fileStorageContent.Contents[0].Key).to.eq(newFileId);

			const modifiedFile = await storageProvider.headObject({ Bucket: bucketName, Key: newFileId }).promise();

			expect(modifiedFile.Metadata.expires).to.eq('true');

			await cleanupStorageProvider(storageProvider, bucketName, [fileId]);
		});

		it('should throw an error if more then 1000 files should be deleted at once', async () => {
			const fileIds = new Array(1001).fill(testObjects.generateObjectId());
			expect(fileStorageProviderRepo.moveFilesToTrash(storageProviderInfo, 'bucketName', fileIds)).to.be.rejected;
		});
	});

	describe('moveFilesToTrashBatch', () => {
		let bucketName;
		let fileIds;
		let storageProvider;

		beforeEach(async function beforeEach() {
			if (skipMinioTests) {
				this.currentTest.fn = function skipFunction() {
					this.skip();
				};
				return;
			}
			bucketName = `bucket-${testObjects.generateObjectId()}`;
			fileIds = new Array(20).fill().map(() => testObjects.generateObjectId().toString());
			storageProvider = fileStorageProviderRepo.private.createStorageProviderInstance(storageProviderInfo);
			await storageProvider.createBucket({ Bucket: bucketName }).promise();
			await Promise.all(
				fileIds.map((fileId) =>
					storageProvider
						.upload({
							Bucket: bucketName,
							Key: fileId,
							Body: 'test',
						})
						.promise()
				)
			);
		});

		afterEach(async () => {
			sinon.restore();
			if (!skipMinioTests) {
				await cleanupStorageProvider(storageProvider, bucketName, fileIds);
			}
		});

		it('should call moveFileToTrash in unevenly distributed batches', async () => {
			Configuration.set('REQUEST_LIMIT_STORAGE_PROVIDER', 5);
			const moveFilesToTrashSpy = sinon.spy(fileStorageProviderRepo, 'moveFilesToTrash');

			const resetSpy = fileStorageProviderRepo.__set__('moveFilesToTrash', moveFilesToTrashSpy);

			const result = await fileStorageProviderRepo.moveFilesToTrashBatch(storageProviderInfo, bucketName, fileIds);

			expect(result).to.eq(true);
			expect(moveFilesToTrashSpy.callCount).to.eq(4);
			expect(moveFilesToTrashSpy.getCall(0).args).deep.to.equal([storageProviderInfo, bucketName, fileIds.slice(0, 5)]);
			expect(moveFilesToTrashSpy.getCall(1).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(5, 10),
			]);
			expect(moveFilesToTrashSpy.getCall(2).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(10, 15),
			]);
			expect(moveFilesToTrashSpy.getCall(3).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(15, 20),
			]);

			resetSpy();
		});

		it('should call moveFileToTrash in evenly distributed batches', async () => {
			Configuration.set('REQUEST_LIMIT_STORAGE_PROVIDER', 6);
			const moveFilesToTrashSpy = sinon.spy(fileStorageProviderRepo, 'moveFilesToTrash');

			const resetSpy = fileStorageProviderRepo.__set__('moveFilesToTrash', moveFilesToTrashSpy);

			const result = await fileStorageProviderRepo.moveFilesToTrashBatch(storageProviderInfo, bucketName, fileIds);

			expect(result).to.eq(true);
			expect(moveFilesToTrashSpy.callCount).to.eq(4);
			expect(moveFilesToTrashSpy.getCall(0).args).deep.to.equal([storageProviderInfo, bucketName, fileIds.slice(0, 6)]);
			expect(moveFilesToTrashSpy.getCall(1).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(6, 12),
			]);
			expect(moveFilesToTrashSpy.getCall(2).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(12, 18),
			]);
			expect(moveFilesToTrashSpy.getCall(3).args).deep.to.equal([
				storageProviderInfo,
				bucketName,
				fileIds.slice(18, 20),
			]);

			resetSpy();
		});
	});

	describe('deleteFile', () => {
		beforeEach(function beforeEach() {
			if (skipMinioTests) {
				this.currentTest.fn = function skipFunction() {
					this.skip();
				};
			}
		});

		it('should delete the given file', async () => {
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

			const fileStorageContentBefore = await storageProvider.listObjectsV2({ Bucket: bucketName }).promise();
			expect(fileStorageContentBefore.Contents).to.be.an('array').of.length(1);

			await fileStorageProviderRepo.deleteFile(storageProvider, bucketName, fileId);

			const fileStorageContentAfter = await storageProvider.listObjectsV2({ Bucket: bucketName }).promise();
			expect(fileStorageContentAfter.Contents).to.be.an('array').of.length(0);
		});
	});
});
