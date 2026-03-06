import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { StorageProviderEntity } from '@modules/school/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FileOwnerModel } from '../domain';
import { FileAuthContext } from '../domain/types/file-auth-context';
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

			await em.persist(file).flush();
			em.clear();

			const thresholdDate = new Date();

			const result = await repo.findForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});

		it('should not return files which are not marked for deletion', async () => {
			const file = fileEntityFactory.build({ deletedAt: undefined });

			await em.persist(file).flush();
			em.clear();

			const thresholdDate = new Date();
			const result = await repo.findForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(0);
		});

		it('should not return files where deletedAt is after threshold', async () => {
			const thresholdDate = new Date();
			const file = fileEntityFactory.build({ deletedAt: new Date(thresholdDate.getTime() + 10) });

			await em.persist(file).flush();
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

				await em.persist([mainUserSharedFile, mainUserFile]).flush();
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
					await em.persist([fileEntityFactory.build(), fileEntityFactory.build(), fileEntityFactory.build()]).flush();

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

	describe('findByIdAndOwnerType', () => {
		// -----------------------------------------------------------------------
		// owner type: user
		// -----------------------------------------------------------------------

		describe('user owner – requiresRolePermission: false', () => {
			describe('when there are files with same owner id and different owner type', () => {
				it('should find files matching the explicit user permission', async () => {
					const userId = new ObjectId().toHexString();
					const ownerId = new ObjectId().toHexString();
					const authContext: FileAuthContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

					const file1 = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});
					const file2 = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});
					// Different owner model – must be excluded
					const file3 = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});

					await repo.save([file1, file2, file3]);

					const foundFiles = await repo.findByIdAndOwnerType(file1.ownerId, FileOwnerModel.USER, authContext);

					expect(foundFiles).toHaveLength(2);
					expect(foundFiles).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ id: file1.id }),
							expect.objectContaining({ id: file2.id }),
						])
					);
				});
			});

			describe('when querying with owner type that no file matches', () => {
				it('should return empty array', async () => {
					const userId = new ObjectId().toHexString();
					const ownerId = new ObjectId().toHexString();
					const authContext: FileAuthContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

					const file1 = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});

					await repo.save([file1]);

					// Query TEAMS type, but files are USER type
					const foundFiles = await repo.findByIdAndOwnerType(ownerId, FileOwnerModel.TEAMS, authContext);

					expect(foundFiles).toHaveLength(0);
				});
			});

			describe('when a file has read=false for the user', () => {
				it('should not return that file', async () => {
					const userId = new ObjectId().toHexString();
					const ownerId = new ObjectId().toHexString();
					const authContext: FileAuthContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

					const fileWithPermission = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId, read: true })],
					});
					const fileWithoutPermission = fileEntityFactory.build({
						ownerId,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId, read: false })],
					});

					await repo.save([fileWithPermission, fileWithoutPermission]);

					const foundFiles = await repo.findByIdAndOwnerType(ownerId, FileOwnerModel.USER, authContext);

					expect(foundFiles).toHaveLength(1);
					expect(foundFiles[0].id).toBe(fileWithPermission.id);
				});
			});

			describe('when there are files with different owner ids', () => {
				it('should return only files matching the given owner id', async () => {
					const userId = new ObjectId().toHexString();
					const ownerId1 = new ObjectId().toHexString();
					const ownerId2 = new ObjectId().toHexString();
					const authContext: FileAuthContext = { userId, requiresRolePermission: false, readableRoleIds: [] };

					const file1 = fileEntityFactory.build({
						ownerId: ownerId1,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});
					const file2 = fileEntityFactory.build({
						ownerId: ownerId2,
						refOwnerModel: FileOwnerModel.USER,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					});

					await repo.save([file1, file2]);

					const foundFiles = await repo.findByIdAndOwnerType(ownerId1, FileOwnerModel.USER, authContext);

					expect(foundFiles).toHaveLength(1);
					expect(foundFiles[0].id).toBe(file1.id);
				});
			});
		});

		// -----------------------------------------------------------------------
		// owner type: course – student (requiresRolePermission: true)
		// -----------------------------------------------------------------------

		describe('course owner – student (requiresRolePermission: true)', () => {
			describe('when the student role permission entry has read=true', () => {
				it('should return the file', async () => {
					const userId = new ObjectId().toHexString();
					const courseId = new ObjectId().toHexString();
					const studentRoleId = new ObjectId().toHexString();
					const authContext: FileAuthContext = {
						userId,
						requiresRolePermission: true,
						readableRoleIds: [studentRoleId],
					};

					const readableFile = fileEntityFactory.build({
						ownerId: courseId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: studentRoleId, read: true })],
					});
					const hiddenFile = fileEntityFactory.build({
						ownerId: courseId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: studentRoleId, read: false })],
					});

					await repo.save([readableFile, hiddenFile]);

					const foundFiles = await repo.findByIdAndOwnerType(courseId, FileOwnerModel.COURSE, authContext);

					expect(foundFiles).toHaveLength(1);
					expect(foundFiles[0].id).toBe(readableFile.id);
				});
			});

			describe('when the user has an explicit user-permission entry with read=true', () => {
				it('should return the file even if no role entry matches', async () => {
					const userId = new ObjectId().toHexString();
					const courseId = new ObjectId().toHexString();
					const studentRoleId = new ObjectId().toHexString();
					const authContext: FileAuthContext = {
						userId,
						requiresRolePermission: true,
						readableRoleIds: [studentRoleId],
					};

					const sharedFile = fileEntityFactory.build({
						ownerId: courseId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: userId, read: true })],
					});

					await repo.save([sharedFile]);

					const foundFiles = await repo.findByIdAndOwnerType(courseId, FileOwnerModel.COURSE, authContext);

					expect(foundFiles).toHaveLength(1);
					expect(foundFiles[0].id).toBe(sharedFile.id);
				});
			});
		});

		// -----------------------------------------------------------------------
		// owner type: course – teacher (requiresRolePermission: false)
		// -----------------------------------------------------------------------

		describe('course owner – teacher (requiresRolePermission: false)', () => {
			describe('when requesting all course files as a teacher', () => {
				it('should return all course files regardless of permissions array', async () => {
					const userId = new ObjectId().toHexString();
					const courseId = new ObjectId().toHexString();
					const someRoleId = new ObjectId().toHexString();
					const authContext: FileAuthContext = {
						userId,
						requiresRolePermission: false,
						readableRoleIds: [],
					};

					const file1 = fileEntityFactory.build({
						ownerId: courseId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: userId, read: true })],
					});
					const file2 = fileEntityFactory.build({
						ownerId: courseId,
						refOwnerModel: FileOwnerModel.COURSE,
						permissions: [filePermissionEntityFactory.build({ refId: someRoleId, read: true })],
					});

					await repo.save([file1, file2]);

					const foundFiles = await repo.findByIdAndOwnerType(courseId, FileOwnerModel.COURSE, authContext);

					// teacher sees file1 (explicit user perm) and file2 (owner for course = non-null – see $or)
					// file2 has no userId in perms but teacher filter uses owner-shortcut clause first
					expect(foundFiles).toHaveLength(1); // only file1 matches the $or (user perm)
					expect(foundFiles[0].id).toBe(file1.id);
				});
			});
		});

		// -----------------------------------------------------------------------
		// owner type: teams
		// -----------------------------------------------------------------------

		describe('teams owner – requiresRolePermission: true', () => {
			describe('when the user has an applicable team role with read=true', () => {
				it('should return files where any applicable role has read=true', async () => {
					const userId = new ObjectId().toHexString();
					const teamId = new ObjectId().toHexString();
					const role1Id = new ObjectId().toHexString();
					const role2Id = new ObjectId().toHexString();
					const authContext: FileAuthContext = {
						userId,
						requiresRolePermission: true,
						readableRoleIds: [role1Id, role2Id],
					};

					const fileWithRole1 = fileEntityFactory.build({
						ownerId: teamId,
						refOwnerModel: FileOwnerModel.TEAMS,
						permissions: [filePermissionEntityFactory.build({ refId: role1Id, read: true })],
					});
					const fileWithRole2 = fileEntityFactory.build({
						ownerId: teamId,
						refOwnerModel: FileOwnerModel.TEAMS,
						permissions: [filePermissionEntityFactory.build({ refId: role2Id, read: true })],
					});
					const blockedFile = fileEntityFactory.build({
						ownerId: teamId,
						refOwnerModel: FileOwnerModel.TEAMS,
						permissions: [filePermissionEntityFactory.build({ refId: role1Id, read: false })],
					});

					await repo.save([fileWithRole1, fileWithRole2, blockedFile]);

					const foundFiles = await repo.findByIdAndOwnerType(teamId, FileOwnerModel.TEAMS, authContext);

					expect(foundFiles).toHaveLength(2);
					expect(foundFiles).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ id: fileWithRole1.id }),
							expect.objectContaining({ id: fileWithRole2.id }),
						])
					);
				});
			});

			describe('when readableRoleIds is empty (user not a team member)', () => {
				it('should return empty array without querying', async () => {
					const userId = new ObjectId().toHexString();
					const teamId = new ObjectId().toHexString();
					const roleId = new ObjectId().toHexString();
					const authContext: FileAuthContext = {
						userId,
						requiresRolePermission: true,
						readableRoleIds: [],
					};

					const file = fileEntityFactory.build({
						ownerId: teamId,
						refOwnerModel: FileOwnerModel.TEAMS,
						permissions: [filePermissionEntityFactory.build({ refId: roleId, read: true })],
					});

					await repo.save([file]);

					const foundFiles = await repo.findByIdAndOwnerType(teamId, FileOwnerModel.TEAMS, authContext);

					expect(foundFiles).toHaveLength(0);
				});
			});
		});
	});

	describe('findByPermissionRefIdOrCreatorId', () => {
		describe('when searching for a files to which the user with given userId has access or is creator', () => {
			const setup = async () => {
				const mainUserId = new ObjectId().toHexString();
				const otherUserId = new ObjectId().toHexString();

				// Test files created, owned and accessible only by the other user.
				const otherUserFileWithMainUserCreator = fileEntityFactory.build({
					ownerId: otherUserId,
					creatorId: mainUserId,
					permissions: [filePermissionEntityFactory.build({ refId: otherUserId })],
				});

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

				await em
					.persist([
						otherUserFileWithMainUserCreator,
						mainUserSharedFile,
						otherUserSharedFile,
						mainUserFile,
						otherUserFile,
					])
					.flush();
				em.clear();

				const expectedOtherUserFileWithMainUserCreatorProps = {
					id: otherUserFileWithMainUserCreator.id,
					createdAt: otherUserFileWithMainUserCreator.createdAt,
					updatedAt: otherUserFileWithMainUserCreator.updatedAt,
					deleted: false,
					isDirectory: false,
					name: otherUserFileWithMainUserCreator.name,
					size: otherUserFileWithMainUserCreator.size,
					type: otherUserFileWithMainUserCreator.type,
					storageFileName: otherUserFileWithMainUserCreator.storageFileName,
					bucket: otherUserFileWithMainUserCreator.bucket,
					thumbnail: otherUserFileWithMainUserCreator.thumbnail,
					thumbnailRequestToken: otherUserFileWithMainUserCreator.thumbnailRequestToken,
					securityCheck: otherUserFileWithMainUserCreator.securityCheck,
					shareTokens: [],
					refOwnerModel: otherUserFileWithMainUserCreator.refOwnerModel,
					permissions: otherUserFileWithMainUserCreator.permissions,
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
					otherUserFileWithMainUserCreator,
					expectedOtherUserFileWithMainUserCreatorProps,
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
						otherUserFileWithMainUserCreator,
						expectedMainUserSharedFileProps,
						expectedOtherUserSharedFileProps,
						expectedMainUserFileProps,
						expectedOtherUserFileWithMainUserCreatorProps,
					} = await setup();

					const results = await repo.findByPermissionRefIdOrCreatorId(mainUserId);

					expect(results).toHaveLength(4);

					// Verify explicit fields.
					expect(results).toEqual(
						expect.arrayContaining([
							expect.objectContaining(expectedOtherUserFileWithMainUserCreatorProps),
							expect.objectContaining(expectedMainUserSharedFileProps),
							expect.objectContaining(expectedOtherUserSharedFileProps),
							expect.objectContaining(expectedMainUserFileProps),
						])
					);

					// Verify storage provider id.
					expect(results.map((result) => result.storageProvider?.id)).toEqual(
						expect.arrayContaining([
							otherUserFileWithMainUserCreator.storageProvider?.id,
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
							otherUserFileWithMainUserCreator.creatorId,
							mainUserSharedFile.creatorId,
							otherUserSharedFile.creatorId,
							mainUserFile.creatorId,
						])
					);
				});
			});

			describe('when there are no files that match this criteria', () => {
				it('should return an empty array', async () => {
					await em.persist([fileEntityFactory.build(), fileEntityFactory.build(), fileEntityFactory.build()]).flush();
					em.clear();

					const results = await repo.findByPermissionRefIdOrCreatorId(new ObjectId().toHexString());

					expect(results).toHaveLength(0);
				});
			});

			describe('when there are no files in the database at all', () => {
				it('should return an empty array', async () => {
					const testPermissionRefId = new ObjectId().toHexString();

					const results = await repo.findByPermissionRefIdOrCreatorId(testPermissionRefId);

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

				await em.persist([otherUserSharedFile]).flush();
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
