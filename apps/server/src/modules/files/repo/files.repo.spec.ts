/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { EntityId, File, FilePermission, FileRefOwnerModel, RefPermModel } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { storageProviderFactory, userFileFactory } from '@shared/testing';

import { FilesRepo } from './files.repo';

describe('FilesRepo', () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FilesRepo],
		}).compile();

		repo = module.get(FilesRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(File, {});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(File);
		});
	});

	describe('findAllFilesForCleanup', () => {
		it('should return files marked for deletion', async () => {
			const file = userFileFactory.build({ deletedAt: new Date() });
			await em.persistAndFlush(file);
			em.clear();

			const thresholdDate = new Date();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});

		it('should not return files which are not marked for deletion', async () => {
			const file = userFileFactory.build({ deletedAt: undefined });
			await em.persistAndFlush(file);
			const thresholdDate = new Date();
			em.clear();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);
			expect(result.length).toEqual(0);
		});

		it('should not return files where deletedAt is after threshold', async () => {
			const thresholdDate = new Date();
			const file = userFileFactory.build({ deletedAt: new Date(thresholdDate.getTime() + 10) });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeGreaterThan(thresholdDate.getTime());
			em.clear();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);
			expect(result.length).toEqual(0);
		});
	});

	describe('findByPermissionRefId', () => {
		const testStorageProvider = storageProviderFactory.buildWithId();

		const testUserId = new ObjectId().toHexString();
		const testOtherUserId = new ObjectId().toHexString();

		it('should return proper files that given user has permission to access', async () => {
			// Test files created, owned and accessible only by the other user.
			const testFile1 = new File({
				name: 'test-file-1.txt',
				size: 42,
				type: 'text/plain',
				storageFileName: '001-test-file-1.txt',
				bucket: 'bucket-001',
				storageProvider: testStorageProvider,
				thumbnail: 'https://example.com/thumbnail.png',
				ownerId: testOtherUserId,
				refOwnerModel: FileRefOwnerModel.USER,
				creatorId: testOtherUserId,
				permissions: [
					new FilePermission({
						refId: testOtherUserId,
						refPermModel: RefPermModel.USER,
					}),
				],
				versionKey: 0,
			});

			// Test file created and owned by the main user, but also accessible by the other user.
			const testFile2 = new File({
				name: 'test-file-2.txt',
				size: 42,
				type: 'text/plain',
				storageFileName: '002-test-file-2.txt',
				bucket: 'bucket-002',
				storageProvider: testStorageProvider,
				thumbnail: 'https://example.com/thumbnail.png',
				ownerId: testUserId,
				refOwnerModel: FileRefOwnerModel.USER,
				creatorId: testUserId,
				permissions: [
					new FilePermission({
						refId: testUserId,
						refPermModel: RefPermModel.USER,
					}),
					new FilePermission({
						refId: testOtherUserId,
						refPermModel: RefPermModel.USER,
					}),
				],
				versionKey: 0,
			});

			// Test file created and owned by the other user, but also accessible by the main user.
			const testFile3 = new File({
				name: 'test-file-3.txt',
				size: 42,
				type: 'text/plain',
				storageFileName: '003-test-file-3.txt',
				bucket: 'bucket-003',
				storageProvider: testStorageProvider,
				thumbnail: 'https://example.com/thumbnail.png',
				ownerId: testOtherUserId,
				refOwnerModel: FileRefOwnerModel.USER,
				creatorId: testOtherUserId,
				permissions: [
					new FilePermission({
						refId: testOtherUserId,
						refPermModel: RefPermModel.USER,
					}),
					new FilePermission({
						refId: testUserId,
						refPermModel: RefPermModel.USER,
					}),
				],
				versionKey: 0,
			});

			await em.persistAndFlush([testFile1, testFile2, testFile3]);
			em.clear();

			const expectedRecords = [
				{
					_id: new ObjectId(testFile2.id),
					createdAt: testFile2.createdAt,
					updatedAt: testFile2.updatedAt,
					deleted: false,
					isDirectory: false,
					name: testFile2.name,
					size: testFile2.size,
					type: testFile2.type,
					storageFileName: testFile2.storageFileName,
					bucket: testFile2.bucket,
					storageProviderId: new ObjectId(testFile2.storageProvider?.id),
					thumbnail: testFile2.thumbnail,
					thumbnailRequestToken: testFile2.thumbnailRequestToken,
					securityCheck: testFile2.securityCheck,
					shareTokens: [],
					owner: new ObjectId(testFile2.ownerId),
					refOwnerModel: testFile2.refOwnerModel,
					permissions: testFile2.permissions,
					__v: 0,
				},
				{
					_id: new ObjectId(testFile3.id),
					createdAt: testFile3.createdAt,
					updatedAt: testFile3.updatedAt,
					deleted: false,
					isDirectory: false,
					name: testFile3.name,
					size: testFile3.size,
					type: testFile3.type,
					storageFileName: testFile3.storageFileName,
					bucket: testFile3.bucket,
					storageProviderId: new ObjectId(testFile3.storageProvider?.id),
					thumbnail: testFile3.thumbnail,
					thumbnailRequestToken: testFile3.thumbnailRequestToken,
					securityCheck: testFile3.securityCheck,
					shareTokens: [],
					owner: new ObjectId(testFile3.ownerId),
					refOwnerModel: testFile3.refOwnerModel,
					permissions: testFile3.permissions,
					__v: 0,
				},
			];

			const result = await repo.findByPermissionRefId(testUserId);

			expect(result).toHaveLength(2);
			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining(expectedRecords[0]),
					expect.objectContaining(expectedRecords[1]),
				])
			);
		});

		describe('should return an empty array in case of', () => {
			it('no files with given permissionRefId', async () => {
				// Test files created, owned and accessible only by the other user.
				const testFile1 = new File({
					name: 'test-file-1.txt',
					size: 42,
					type: 'text/plain',
					storageFileName: '001-test-file-1.txt',
					bucket: 'bucket-001',
					storageProvider: testStorageProvider,
					thumbnail: 'https://example.com/thumbnail.png',
					ownerId: testOtherUserId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: testOtherUserId,
					permissions: [
						new FilePermission({
							refId: testOtherUserId,
							refPermModel: RefPermModel.USER,
						}),
					],
					versionKey: 0,
				});

				// A second file also created, owned and accessible only by the other user.
				const testFile2 = new File({
					name: 'test-file-2.txt',
					size: 42,
					type: 'text/plain',
					storageFileName: '002-test-file-2.txt',
					bucket: 'bucket-002',
					storageProvider: testStorageProvider,
					thumbnail: 'https://example.com/thumbnail.png',
					ownerId: testOtherUserId,
					refOwnerModel: FileRefOwnerModel.USER,
					creatorId: testOtherUserId,
					permissions: [
						new FilePermission({
							refId: testOtherUserId,
							refPermModel: RefPermModel.USER,
						}),
					],
					versionKey: 0,
				});

				await em.persistAndFlush([testFile1, testFile2]);
				em.clear();

				const result = await repo.findByPermissionRefId(testUserId);

				expect(result).toHaveLength(0);
			});

			it('no files in the database at all', async () => {
				const testPermissionRefId = new ObjectId().toHexString();

				const result = await repo.findByPermissionRefId(testPermissionRefId);

				expect(result).toHaveLength(0);
			});
		});
	});
});
