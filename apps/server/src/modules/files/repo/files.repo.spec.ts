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

	const testStorageProvider = storageProviderFactory.buildWithId();
	const testMainUserId = new ObjectId().toHexString();
	const testOtherUserId = new ObjectId().toHexString();

	const otherUserFilesProps = [
		// Test file created, owned and accessible only by the other user.
		{
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
		},
		// A second file also created, owned and accessible only by the other user.
		{
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
		},
	];

	const setup = async () => {
		const otherUserFiles = [new File(otherUserFilesProps[0]), new File(otherUserFilesProps[1])];

		// Test files created, owned and accessible only by the other user.
		const otherUserFile = new File({
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
		const mainUserSharedFile = new File({
			name: 'test-file-2.txt',
			size: 42,
			type: 'text/plain',
			storageFileName: '002-test-file-2.txt',
			bucket: 'bucket-002',
			storageProvider: testStorageProvider,
			thumbnail: 'https://example.com/thumbnail.png',
			ownerId: testMainUserId,
			refOwnerModel: FileRefOwnerModel.USER,
			creatorId: testMainUserId,
			permissions: [
				new FilePermission({
					refId: testMainUserId,
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
		const otherUserSharedFile = new File({
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
					refId: testMainUserId,
					refPermModel: RefPermModel.USER,
				}),
			],
			versionKey: 0,
		});

		// Test file created, owned and accessible only by the main user.
		const mainUserFile = new File({
			name: 'test-file-4.txt',
			size: 42,
			type: 'text/plain',
			storageFileName: '004-test-file-4.txt',
			bucket: 'bucket-004',
			storageProvider: testStorageProvider,
			thumbnail: 'https://example.com/thumbnail.png',
			ownerId: testMainUserId,
			refOwnerModel: FileRefOwnerModel.USER,
			creatorId: testMainUserId,
			permissions: [
				new FilePermission({
					refId: testMainUserId,
					refPermModel: RefPermModel.USER,
				}),
			],
			versionKey: 0,
		});

		await em.persistAndFlush([...otherUserFiles, otherUserFile, mainUserSharedFile, otherUserSharedFile, mainUserFile]);
		em.clear();

		const expectedMainUserSharedFile = {
			id: mainUserSharedFile.id,
			createdAt: mainUserSharedFile.createdAt,
			updatedAt: mainUserSharedFile.updatedAt,
			deleted: false,
			isDirectory: false,
			name: mainUserSharedFile.name,
			size: mainUserSharedFile.size,
			type: mainUserSharedFile.type,
			storageFileName: mainUserSharedFile.storageFileName,
			bucket: mainUserSharedFile.bucket,
			thumbnail: mainUserSharedFile.thumbnail,
			thumbnailRequestToken: mainUserSharedFile.thumbnailRequestToken,
			securityCheck: mainUserSharedFile.securityCheck,
			shareTokens: [],
			refOwnerModel: mainUserSharedFile.refOwnerModel,
			permissions: mainUserSharedFile.permissions,
			versionKey: 0,
		};

		const expectedOtherUserSharedFile = {
			id: otherUserSharedFile.id,
			createdAt: otherUserSharedFile.createdAt,
			updatedAt: otherUserSharedFile.updatedAt,
			deleted: false,
			isDirectory: false,
			name: otherUserSharedFile.name,
			size: otherUserSharedFile.size,
			type: otherUserSharedFile.type,
			storageFileName: otherUserSharedFile.storageFileName,
			bucket: otherUserSharedFile.bucket,
			thumbnail: otherUserSharedFile.thumbnail,
			thumbnailRequestToken: otherUserSharedFile.thumbnailRequestToken,
			securityCheck: otherUserSharedFile.securityCheck,
			shareTokens: [],
			refOwnerModel: otherUserSharedFile.refOwnerModel,
			permissions: otherUserSharedFile.permissions,
			versionKey: 0,
		};

		const expectedMainUserFile = {
			id: mainUserFile.id,
			createdAt: mainUserFile.createdAt,
			updatedAt: mainUserFile.updatedAt,
			deleted: false,
			isDirectory: false,
			name: mainUserFile.name,
			size: mainUserFile.size,
			type: mainUserFile.type,
			storageFileName: mainUserFile.storageFileName,
			bucket: mainUserFile.bucket,
			thumbnail: mainUserFile.thumbnail,
			thumbnailRequestToken: mainUserFile.thumbnailRequestToken,
			securityCheck: mainUserFile.securityCheck,
			shareTokens: [],
			refOwnerModel: mainUserFile.refOwnerModel,
			permissions: mainUserFile.permissions,
			versionKey: 0,
		};

		return {
			mainUserSharedFile,
			otherUserSharedFile,
			mainUserFile,
			expectedMainUserSharedFile,
			expectedOtherUserSharedFile,
			expectedMainUserFile,
		};
	};

	describe('findByOwnerUserId', () => {
		it('should return proper files that are owned by the user with given userId', async () => {
			const { mainUserSharedFile, mainUserFile, expectedMainUserSharedFile, expectedMainUserFile } = await setup();

			const results = await repo.findByOwnerUserId(testMainUserId);

			expect(results).toHaveLength(2);

			// Verify explicit fields.
			expect(results).toEqual(
				expect.arrayContaining([
					expect.objectContaining(expectedMainUserSharedFile),
					expect.objectContaining(expectedMainUserFile),
				])
			);

			// Verify storage provider id.
			expect(results.map((result) => result.storageProvider?.id)).toEqual(
				expect.arrayContaining([mainUserSharedFile.storageProvider?.id, mainUserFile.storageProvider?.id])
			);

			// Verify implicit ownerId field.
			expect(results.map((result) => result.ownerId)).toEqual(
				expect.arrayContaining([mainUserSharedFile.ownerId, mainUserFile.ownerId])
			);

			// Verify implicit creatorId field.
			expect(results.map((result) => result.creatorId)).toEqual(
				expect.arrayContaining([mainUserSharedFile.creatorId, mainUserFile.creatorId])
			);
		});

		describe('should return an empty array in case of', () => {
			it('no files owned by user with given userId', async () => {
				await em.persistAndFlush([new File(otherUserFilesProps[0]), new File(otherUserFilesProps[1])]);
				em.clear();

				const results = await repo.findByOwnerUserId(testMainUserId);

				expect(results).toHaveLength(0);
			});

			it('no files in the database at all', async () => {
				const testPermissionRefId = new ObjectId().toHexString();

				const results = await repo.findByOwnerUserId(testPermissionRefId);

				expect(results).toHaveLength(0);
			});
		});
	});

	describe('findByPermissionRefId', () => {
		it('should return proper files that given user has permission to access', async () => {
			const {
				mainUserSharedFile,
				otherUserSharedFile,
				mainUserFile,
				expectedMainUserSharedFile,
				expectedOtherUserSharedFile,
				expectedMainUserFile,
			} = await setup();

			const results = await repo.findByPermissionRefId(testMainUserId);

			expect(results).toHaveLength(3);

			// Verify explicit fields.
			expect(results).toEqual(
				expect.arrayContaining([
					expect.objectContaining(expectedMainUserSharedFile),
					expect.objectContaining(expectedOtherUserSharedFile),
					expect.objectContaining(expectedMainUserFile),
				])
			);

			// Verify storage provider id.
			expect(results.map((result) => result.storageProvider?.id)).toEqual(
				expect.arrayContaining([
					mainUserSharedFile.storageProvider?.id,
					otherUserSharedFile.storageProvider?.id,
					mainUserFile.storageProvider?.id,
				])
			);

			// Verify implicit ownerId field.
			expect(results.map((result) => result.ownerId)).toEqual(
				expect.arrayContaining([mainUserSharedFile.ownerId, otherUserSharedFile.ownerId, mainUserFile.ownerId])
			);

			// Verify implicit creatorId field.
			expect(results.map((result) => result.creatorId)).toEqual(
				expect.arrayContaining([mainUserSharedFile.creatorId, otherUserSharedFile.creatorId, mainUserFile.creatorId])
			);
		});

		describe('should return an empty array in case of', () => {
			it('no files with given permissionRefId', async () => {
				await em.persistAndFlush([new File(otherUserFilesProps[0]), new File(otherUserFilesProps[1])]);
				em.clear();

				const results = await repo.findByPermissionRefId(testMainUserId);

				expect(results).toHaveLength(0);
			});

			it('no files in the database at all', async () => {
				const testPermissionRefId = new ObjectId().toHexString();

				const results = await repo.findByPermissionRefId(testPermissionRefId);

				expect(results).toHaveLength(0);
			});
		});
	});
});
