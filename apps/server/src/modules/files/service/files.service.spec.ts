import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { FilesService } from './files.service';
import { FilesRepo } from '../repo';
import { fileEntityFactory, filePermissionEntityFactory } from '../entity/testing';
import { FileEntity } from '../entity';

describe(FilesService.name, () => {
	let module: TestingModule;
	let service: FilesService;
	let repo: DeepMocked<FilesRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesService,
				{
					provide: FilesRepo,
					useValue: createMock<FilesRepo>(),
				},
			],
		}).compile();

		service = module.get(FilesService);
		repo = module.get(FilesRepo);

		await setupEntities();
	});

	afterEach(() => {
		repo.findByPermissionRefId.mockClear();
		repo.findByOwnerUserId.mockClear();
		repo.save.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findFilesAccessibleByUser', () => {
		describe('when called with a userId of a user that', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const accessibleFiles: FileEntity[] = [];

				for (let i = 0; i < 5; i += 1) {
					accessibleFiles.push(
						fileEntityFactory.build({
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						})
					);
				}

				return { userId, accessibleFiles };
			};

			describe("doesn't have an access to any files", () => {
				it('should return an empty array', async () => {
					const { userId } = setup();

					repo.findByPermissionRefId.mockResolvedValueOnce([]);

					const result = await service.findFilesAccessibleByUser(userId);

					expect(repo.findByPermissionRefId).toBeCalledWith(userId);
					expect(result).toEqual([]);
				});
			});

			describe('does have an access to some files', () => {
				it('should return an array containing proper file entities', async () => {
					const { userId, accessibleFiles } = setup();

					repo.findByPermissionRefId.mockResolvedValueOnce(accessibleFiles);

					const result = await service.findFilesAccessibleByUser(userId);

					expect(repo.findByPermissionRefId).toBeCalledWith(userId);
					expect(result).toEqual(accessibleFiles);
				});
			});
		});
	});

	describe('removeUserPermissionsToAnyFiles', () => {
		it('should not modify any files if there are none that user has permission to access', async () => {
			const userId = new ObjectId().toHexString();
			repo.findByPermissionRefId.mockResolvedValueOnce([]);

			const result = await service.removeUserPermissionsToAnyFiles(userId);

			expect(result).toEqual(0);

			expect(repo.findByPermissionRefId).toBeCalledWith(userId);
			expect(repo.save).not.toBeCalled();
		});

		describe('should properly remove user permissions', () => {
			it('in case of just a single file accessible by given user', async () => {
				const userId = new ObjectId().toHexString();
				const userPermission = filePermissionEntityFactory.build({ refId: userId });
				const entity = fileEntityFactory.buildWithId({ permissions: [userPermission] });

				repo.findByPermissionRefId.mockResolvedValueOnce([entity]);

				const result = await service.removeUserPermissionsToAnyFiles(userId);

				expect(result).toEqual(1);
				expect(entity.permissions).not.toContain(userPermission);

				expect(repo.findByPermissionRefId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity]);
			});

			it('in case of many files accessible by given user', async () => {
				const userId = new ObjectId().toHexString();
				const userPermission = filePermissionEntityFactory.build({ refId: userId });
				const anotherUserPermission = filePermissionEntityFactory.build();
				const yetAnotherUserPermission = filePermissionEntityFactory.build();
				const entities = [
					fileEntityFactory.buildWithId({
						permissions: [userPermission, anotherUserPermission, yetAnotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [yetAnotherUserPermission, userPermission, anotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [anotherUserPermission, yetAnotherUserPermission, userPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [userPermission, yetAnotherUserPermission, anotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [yetAnotherUserPermission, anotherUserPermission, userPermission],
					}),
				];

				repo.findByPermissionRefId.mockResolvedValueOnce(entities);

				const result = await service.removeUserPermissionsToAnyFiles(userId);

				expect(result).toEqual(5);

				entities.forEach((entity) => {
					expect(entity.permissions).not.toContain(userPermission);
					expect(entity.permissions).toContain(anotherUserPermission);
					expect(entity.permissions).toContain(yetAnotherUserPermission);
				});

				expect(repo.findByPermissionRefId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
			});
		});
	});

	describe('findFilesOwnedByUser', () => {
		describe('when called with a userId of a user that', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const ownedFiles: FileEntity[] = [];

				for (let i = 0; i < 5; i += 1) {
					ownedFiles.push(
						fileEntityFactory.build({
							ownerId: userId,
							creatorId: userId,
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						})
					);
				}

				return { userId, ownedFiles };
			};

			describe("doesn't own any files", () => {
				it('should return an empty array', async () => {
					const { userId } = setup();

					repo.findByOwnerUserId.mockResolvedValueOnce([]);

					const result = await service.findFilesOwnedByUser(userId);

					expect(repo.findByOwnerUserId).toBeCalledWith(userId);
					expect(result).toEqual([]);
				});
			});

			describe('does own some files', () => {
				it('should return an array containing proper file entities', async () => {
					const { userId, ownedFiles } = setup();

					repo.findByOwnerUserId.mockResolvedValueOnce(ownedFiles);

					const result = await service.findFilesOwnedByUser(userId);

					expect(repo.findByOwnerUserId).toBeCalledWith(userId);
					expect(result).toEqual(ownedFiles);
				});
			});
		});
	});

	describe('markFilesOwnedByUserForDeletion', () => {
		const verifyEntityChanges = (entity: FileEntity) => {
			expect(entity.deleted).toEqual(true);

			const deletedAtTime = entity.deletedAt?.getTime();

			expect(deletedAtTime).toBeGreaterThan(0);
			expect(deletedAtTime).toBeLessThanOrEqual(new Date().getTime());
		};

		it('should not mark any files for deletion if there are none owned by given user', async () => {
			const userId = new ObjectId().toHexString();
			repo.findByOwnerUserId.mockResolvedValueOnce([]);

			const result = await service.markFilesOwnedByUserForDeletion(userId);

			expect(result).toEqual(0);

			expect(repo.findByOwnerUserId).toBeCalledWith(userId);
			expect(repo.save).not.toBeCalled();
		});

		describe('should properly mark files for deletion', () => {
			it('in case of just a single file owned by given user', async () => {
				const entity = fileEntityFactory.buildWithId();
				const userId = entity.ownerId;
				repo.findByOwnerUserId.mockResolvedValueOnce([entity]);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(1);
				verifyEntityChanges(entity);

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity]);
			});

			it('in case of many files owned by the user', async () => {
				const userId = new ObjectId().toHexString();
				const entities = [
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
				];
				repo.findByOwnerUserId.mockResolvedValueOnce(entities);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(5);
				entities.forEach((entity) => verifyEntityChanges(entity));

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
			});
		});
	});
});
