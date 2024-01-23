import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(FilesService);
		repo = module.get(FilesRepo);

		await setupEntities();
	});

	afterEach(() => {
		repo.findByPermissionRefIdOrCreatorId.mockClear();
		repo.findByOwnerUserId.mockClear();
		repo.save.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findFilesAccessibleOrCreatedByUser', () => {
		describe('when called with a userId of a user that', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const userId2 = new ObjectId().toHexString();
				const userId3 = new ObjectId().toHexString();
				const accessibleOrCreatedFiles: FileEntity[] = [];

				for (let i = 0; i < 5; i += 1) {
					accessibleOrCreatedFiles.push(
						fileEntityFactory.build({
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
						}),
						fileEntityFactory.build({
							creatorId: userId2,
						}),
						fileEntityFactory.build({
							permissions: [filePermissionEntityFactory.build({ refId: userId })],
							creatorId: userId3,
						}),
						fileEntityFactory.build({
							permissions: [filePermissionEntityFactory.build({ refId: userId3 })],
							creatorId: userId,
						})
					);
				}

				return { userId, accessibleOrCreatedFiles };
			};

			describe("doesn't have an access or is creator of any files", () => {
				it('should return an empty array', async () => {
					const { userId } = setup();

					repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([]);

					const result = await service.findFilesAccessibleOrCreatedByUser(userId);

					expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
					expect(result).toEqual([]);
				});
			});

			describe('does have an access or is creator of some files', () => {
				it('should return an array containing proper file entities', async () => {
					const { userId, accessibleOrCreatedFiles } = setup();

					repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce(accessibleOrCreatedFiles);

					const result = await service.findFilesAccessibleOrCreatedByUser(userId);

					expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
					expect(result).toEqual(accessibleOrCreatedFiles);
				});
			});
		});
	});

	describe('removeUserPermissionsOrCreatorReferenceToAnyFiles', () => {
		it('should not modify any files if there are none that user has permission to access or is creator', async () => {
			const userId = new ObjectId().toHexString();
			repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([]);

			const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

			expect(result).toEqual(0);

			expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
			expect(repo.save).not.toBeCalled();
		});

		describe('should properly remove user permissions, creatorId reference', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const userPermission = filePermissionEntityFactory.build({ refId: userId });

				const entity = fileEntityFactory.buildWithId({ permissions: [userPermission], creatorId: userId });
				const entity2 = fileEntityFactory.buildWithId({ creatorId: userId });
				const entity3 = fileEntityFactory.buildWithId({ permissions: [userPermission] });

				repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([entity, entity2, entity3]);
				return { userId, userPermission, entity, entity2, entity3 };
			};
			it('in case of just a single file (permission) accessible by given user and couple of files created', async () => {
				const { userId, userPermission, entity, entity2, entity3 } = setup();

				const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

				expect(result).toEqual(3);
				expect(entity3.permissions).not.toContain(userPermission);
				expect(entity._creatorId).toBe(undefined);
				expect(entity3.permissions).not.toContain(userPermission);
				expect(entity2._creatorId).toBe(undefined);

				expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity, entity2, entity3]);
			});

			it('in case of many files accessible or created by given user', async () => {
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
						creatorId: userId,
					}),
					fileEntityFactory.buildWithId({
						permissions: [anotherUserPermission, yetAnotherUserPermission, userPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [userPermission, yetAnotherUserPermission, anotherUserPermission],
						creatorId: userId,
					}),
					fileEntityFactory.buildWithId({
						permissions: [yetAnotherUserPermission, anotherUserPermission, userPermission],
					}),
				];

				repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce(entities);

				const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

				expect(result).toEqual(5);

				for (let i = 0; i < entities.length; i += 1) {
					expect(entities[i].permissions).not.toContain(userPermission);
					if (i === 1 || i === 3) {
						expect(entities[i]._creatorId).toBe(undefined);
					}
					expect(entities[i].permissions).toContain(anotherUserPermission);
					expect(entities[i].permissions).toContain(yetAnotherUserPermission);
				}

				expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
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
