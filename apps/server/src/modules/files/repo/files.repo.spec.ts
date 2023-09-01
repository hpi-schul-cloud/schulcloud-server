import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { StorageProviderEntity } from '@shared/domain';
import { FileEntity } from '../entity';
import { fileEntityFactory, filePermissionEntityFactory } from '../entity/testing';
import { FilesRepo } from './files.repo';

describe(FilesRepo.name, () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [FileEntity, StorageProviderEntity],
				}),
			],
			providers: [FilesRepo],
		}).compile();

		repo = module.get(FilesRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(FileEntity, {});
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
			expect(repo.entityName).toBe(FileEntity);
		});
	});

	describe('findForCleanup', () => {
		it('should return files marked for deletion according to given params', async () => {
			const file: FileEntity = fileEntityFactory.build({ deletedAt: new Date() });

			await em.persistAndFlush(file);
			em.clear();

			const thresholdDate = new Date();

			const result = await repo.findForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});

		it('should not return files which are not marked for deletion', async () => {
			const file = fileEntityFactory.build({ deletedAt: undefined });

			await em.persistAndFlush(file);
			em.clear();

			const thresholdDate = new Date();
			const result = await repo.findForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(0);
		});

		it('should not return files where deletedAt is after threshold', async () => {
			const thresholdDate = new Date();
			const file = fileEntityFactory.build({ deletedAt: new Date(thresholdDate.getTime() + 10) });

			await em.persistAndFlush(file);
			em.clear();

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeGreaterThan(thresholdDate.getTime());

			const result = await repo.findForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(0);
		});
	});

	describe('findByOwnerUserId', () => {
		describe('when searching for a files owned by the user with given userId', () => {
			const setup = async () => {
				const mainUserId = new ObjectId().toHexString();
				const otherUserId = new ObjectId().toHexString();

				// Test file created, owned and accessible only by the main user.
				const mainUserFile = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [filePermissionEntityFactory.build({ refId: mainUserId })],
				});

				// Test file created and owned by the main user, but also accessible by the other user.
				const mainUserSharedFile = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [
						filePermissionEntityFactory.build({ refId: mainUserId }),
						filePermissionEntityFactory.build({ refId: otherUserId }),
					],
				});

				await em.persistAndFlush([mainUserSharedFile, mainUserFile]);
				em.clear();

				const expectedMainUserFileProps = {
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

				const expectedMainUserSharedFileProps = {
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

				return {
					mainUserIdd: mainUserId,
					mainUserFile,
					mainUserSharedFile,
					expectedMainUserFileProps,
					expectedMainUserSharedFileProps,
				};
			};

			describe('when there are some files that match this criteria', () => {
				it('should return proper files', async () => {
					const {
						mainUserIdd,
						mainUserSharedFile,
						mainUserFile,
						expectedMainUserSharedFileProps,
						expectedMainUserFileProps,
					} = await setup();

					const results = await repo.findByOwnerUserId(mainUserIdd);

					expect(results).toHaveLength(2);

					// Verify explicit fields.
					expect(results).toEqual(
						expect.arrayContaining([
							expect.objectContaining(expectedMainUserSharedFileProps),
							expect.objectContaining(expectedMainUserFileProps),
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
			});

			describe('when there are no files that match this criteria', () => {
				it('should return an empty array', async () => {
					await em.persistAndFlush([fileEntityFactory.build(), fileEntityFactory.build(), fileEntityFactory.build()]);

					em.clear();

					const results = await repo.findByOwnerUserId(new ObjectId().toHexString());

					expect(results).toHaveLength(0);
				});
			});

			describe('when there are no files in the database at all', () => {
				it('should return an empty array', async () => {
					const testPermissionRefId = new ObjectId().toHexString();

					const results = await repo.findByOwnerUserId(testPermissionRefId);

					expect(results).toHaveLength(0);
				});
			});
		});
	});

	describe('findByPermissionRefId', () => {
		describe('when searching for a files to which the user with given userId has access', () => {
			const setup = async () => {
				const mainUserId = new ObjectId().toHexString();
				const otherUserId = new ObjectId().toHexString();

				// Test files created, owned and accessible only by the other user.
				const otherUserFile = fileEntityFactory.build({
					ownerId: otherUserId,
					creatorId: otherUserId,
					permissions: [filePermissionEntityFactory.build({ refId: otherUserId })],
				});

				// Test file created and owned by the main user, but also accessible by the other user.
				const mainUserSharedFile = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [
						filePermissionEntityFactory.build({ refId: mainUserId }),
						filePermissionEntityFactory.build({ refId: otherUserId }),
					],
				});

				// Test file created and owned by the other user, but also accessible by the main user.
				const otherUserSharedFile = fileEntityFactory.build({
					ownerId: otherUserId,
					creatorId: otherUserId,
					permissions: [
						filePermissionEntityFactory.build({ refId: otherUserId }),
						filePermissionEntityFactory.build({ refId: mainUserId }),
					],
				});

				// Test file created, owned and accessible only by the main user.
				const mainUserFile = fileEntityFactory.build({
					ownerId: mainUserId,
					creatorId: mainUserId,
					permissions: [filePermissionEntityFactory.build({ refId: mainUserId })],
				});

				await em.persistAndFlush([otherUserFile, mainUserSharedFile, otherUserSharedFile, mainUserFile]);
				em.clear();

				const expectedMainUserSharedFileProps = {
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

				const expectedOtherUserSharedFileProps = {
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

				const expectedMainUserFileProps = {
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
					mainUserId,
					mainUserSharedFile,
					otherUserSharedFile,
					mainUserFile,
					expectedMainUserSharedFileProps,
					expectedOtherUserSharedFileProps,
					expectedMainUserFileProps,
				};
			};

			describe('when there are some files that match this criteria', () => {
				it('should return proper files', async () => {
					const {
						mainUserId,
						mainUserSharedFile,
						otherUserSharedFile,
						mainUserFile,
						expectedMainUserSharedFileProps,
						expectedOtherUserSharedFileProps,
						expectedMainUserFileProps,
					} = await setup();

					const results = await repo.findByPermissionRefId(mainUserId);

					expect(results).toHaveLength(3);

					// Verify explicit fields.
					expect(results).toEqual(
						expect.arrayContaining([
							expect.objectContaining(expectedMainUserSharedFileProps),
							expect.objectContaining(expectedOtherUserSharedFileProps),
							expect.objectContaining(expectedMainUserFileProps),
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
						expect.arrayContaining([
							mainUserSharedFile.creatorId,
							otherUserSharedFile.creatorId,
							mainUserFile.creatorId,
						])
					);
				});
			});

			describe('when there are no files that match this criteria', () => {
				it('should return an empty array', async () => {
					await em.persistAndFlush([fileEntityFactory.build(), fileEntityFactory.build(), fileEntityFactory.build()]);
					em.clear();

					const results = await repo.findByPermissionRefId(new ObjectId().toHexString());

					expect(results).toHaveLength(0);
				});
			});

			describe('when there are no files in the database at all', () => {
				it('should return an empty array', async () => {
					const testPermissionRefId = new ObjectId().toHexString();

					const results = await repo.findByPermissionRefId(testPermissionRefId);

					expect(results).toHaveLength(0);
				});
			});
		});
	});

	describe('save', () => {
		describe('when modifying given file permissions', () => {
			const setup = async () => {
				const mainUserId = new ObjectId().toHexString();
				const otherUserId = new ObjectId().toHexString();

				// Test file created and owned by the other user, but also accessible by the main user.
				const otherUserSharedFile = fileEntityFactory.build({
					ownerId: otherUserId,
					creatorId: otherUserId,
					permissions: [
						filePermissionEntityFactory.build({ refId: otherUserId }),
						filePermissionEntityFactory.build({ refId: mainUserId }),
					],
				});

				await em.persistAndFlush([otherUserSharedFile]);
				em.clear();

				const expectedOtherUserSharedFileProps = {
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

				return {
					mainUserId,
					otherUserSharedFile,
					expectedOtherUserSharedFileProps,
				};
			};

			it('should properly update stored file', async () => {
				const initialFiles = await setup();
				let { otherUserSharedFile } = initialFiles;
				const { mainUserId, expectedOtherUserSharedFileProps } = initialFiles;

				// Pre-check to make sure the main user has access to the file right now.
				expect(otherUserSharedFile.permissions).toEqual(
					expect.arrayContaining([filePermissionEntityFactory.build({ refId: mainUserId })])
				);

				otherUserSharedFile.removePermissionsByRefId(mainUserId);

				await repo.save(otherUserSharedFile);

				otherUserSharedFile = await repo.findById(otherUserSharedFile.id);

				// Verify if the main user has for sure lost the permission to given file.
				expect(otherUserSharedFile.permissions).not.toEqual(
					expect.arrayContaining([filePermissionEntityFactory.build({ refId: mainUserId })])
				);

				expectedOtherUserSharedFileProps.permissions = expectedOtherUserSharedFileProps.permissions.filter(
					(permission) => !permission.refId.equals(new ObjectId(mainUserId))
				);

				// Verify if other file fields are still untouched after the update,
				//  except the updatedAt field which is expected to change.
				expect(expectedOtherUserSharedFileProps.updatedAt.getTime()).toBeLessThanOrEqual(
					otherUserSharedFile.updatedAt.getTime()
				);

				expectedOtherUserSharedFileProps.updatedAt = otherUserSharedFile.updatedAt;

				expect(otherUserSharedFile).toEqual(expect.objectContaining(expectedOtherUserSharedFileProps));
			});
		});

		describe('when marking given file for deletion', () => {
			it('should properly update stored file', async () => {
				let file = fileEntityFactory.build();

				const originalUpdatedAt = file.updatedAt;

				// Pre-check to make sure the file is not marked as deleted yet.
				expect(file.isMarkedForDeletion()).toEqual(false);

				file.markForDeletion();

				await repo.save(file);

				file = await repo.findById(file.id);

				// Verify if the file has for sure been marked as deleted.
				expect(file.isMarkedForDeletion()).toEqual(true);

				// Verify if other file fields are still untouched after the update,
				//  except the updatedAt field which is expected to change.
				expect(originalUpdatedAt.getTime()).toBeLessThanOrEqual(originalUpdatedAt.getTime());

				const expectedFileProps = {
					id: file.id,
					createdAt: file.createdAt,
					updatedAt: file.updatedAt,
					deletedAt: file.deletedAt,
					deleted: true,
					isDirectory: false,
					name: file.name,
					size: file.size,
					type: file.type,
					storageFileName: file.storageFileName,
					bucket: file.bucket,
					thumbnail: file.thumbnail,
					thumbnailRequestToken: file.thumbnailRequestToken,
					securityCheck: file.securityCheck,
					shareTokens: [],
					refOwnerModel: file.refOwnerModel,
					permissions: file.permissions,
					versionKey: 0,
				};

				expect(file).toEqual(expect.objectContaining(expectedFileProps));
			});
		});
	});
});
