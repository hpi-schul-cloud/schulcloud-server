import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { EventBus } from '@nestjs/cqrs';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	deletionRequestFactory,
	DataDeletedEvent,
} from '@modules/deletion';
import { FilesService } from './files.service';
import { FilesRepo } from '../repo';
import { fileEntityFactory, filePermissionEntityFactory } from '../entity/testing';
import { FileEntity } from '../entity';

describe(FilesService.name, () => {
	let module: TestingModule;
	let service: FilesService;
	let repo: DeepMocked<FilesRepo>;
	let eventBus: DeepMocked<EventBus>;

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
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get(FilesService);
		repo = module.get(FilesRepo);
		eventBus = module.get(EventBus);

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
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const userPermission = filePermissionEntityFactory.build({ refId: userId });
			const anotherUserPermission = filePermissionEntityFactory.build();
			const yetAnotherUserPermission = filePermissionEntityFactory.build();

			const entity1 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
				creatorId: userId,
			});
			const entity2 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
				creatorId: userId,
			});
			const entity3 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
			});
			const entity4 = fileEntityFactory.buildWithId({
				permissions: [anotherUserPermission, yetAnotherUserPermission, userPermission],
				creatorId: userId,
			});
			const entity5 = fileEntityFactory.buildWithId({
				permissions: [anotherUserPermission, yetAnotherUserPermission, userPermission],
				creatorId: userId,
			});
			const entity6 = fileEntityFactory.buildWithId({
				permissions: [yetAnotherUserPermission, userPermission, anotherUserPermission],
			});

			const entities = [entity4, entity5, entity6];

			const expectedResultWhenFilesNotExists = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 0, []),
			]);

			const expectedResultWhenFilesExistsWithOnlyUserId = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [entity1.id, entity2.id, entity3.id]),
			]);

			const expectedResultWhenManyFilesExistsWithOtherUsers = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [entity4.id, entity5.id, entity6.id]),
			]);

			return {
				entity1,
				entity2,
				entity3,
				entities,
				expectedResultWhenFilesExistsWithOnlyUserId,
				expectedResultWhenManyFilesExistsWithOtherUsers,
				expectedResultWhenFilesNotExists,
				userId,
				userPermission,
				anotherUserPermission,
				yetAnotherUserPermission,
			};
		};

		it('should not modify any files if there are none that user has permission to access or is creator', async () => {
			const { expectedResultWhenFilesNotExists, userId } = setup();

			repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([]);

			const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

			expect(result).toEqual(expectedResultWhenFilesNotExists);

			expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
		});

		describe('should properly remove user permissions, creatorId reference', () => {
			it('in case of just a single file (permission) accessible by given user and couple of files created', async () => {
				const { entity1, entity2, entity3, expectedResultWhenFilesExistsWithOnlyUserId, userId, userPermission } =
					setup();

				repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([entity1, entity2, entity3]);

				const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

				expect(result).toEqual(expectedResultWhenFilesExistsWithOnlyUserId);
				expect(entity3.permissions).not.toContain(userPermission);
				expect(entity1._creatorId).toBe(undefined);
				expect(entity3.permissions).not.toContain(userPermission);
				expect(entity2._creatorId).toBe(undefined);

				expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity1, entity2, entity3]);
			});

			it('in case of many files accessible or created by given user', async () => {
				const {
					entities,
					expectedResultWhenManyFilesExistsWithOtherUsers,
					userId,
					userPermission,
					anotherUserPermission,
					yetAnotherUserPermission,
				} = setup();

				repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce(entities);

				const result = await service.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

				expect(result).toEqual(expectedResultWhenManyFilesExistsWithOtherUsers);

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
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const entity1 = fileEntityFactory.buildWithId({ ownerId: userId });
			const entity2 = fileEntityFactory.buildWithId({ ownerId: userId });
			const entity3 = fileEntityFactory.buildWithId({ ownerId: userId });
			const entities = [entity1, entity2, entity3];

			const expectedResultWhenFilesNotExists = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 0, []),
			]);

			const expectedResultWhenOneFileExists = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 1, [entity1.id]),
			]);

			const expectedResultWhenManyFilesExists = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [entity1.id, entity2.id, entity3.id]),
			]);

			return {
				entities,
				entity1,
				expectedResultWhenOneFileExists,
				expectedResultWhenManyFilesExists,
				expectedResultWhenFilesNotExists,
				userId,
			};
		};

		const verifyEntityChanges = (entity: FileEntity) => {
			expect(entity.deleted).toEqual(true);

			const deletedAtTime = entity.deletedAt?.getTime();

			expect(deletedAtTime).toBeGreaterThan(0);
			expect(deletedAtTime).toBeLessThanOrEqual(new Date().getTime());
		};

		it('should not mark any files for deletion if there are none owned by given user', async () => {
			const { expectedResultWhenFilesNotExists, userId } = setup();

			repo.findByOwnerUserId.mockResolvedValueOnce([]);
			const result = await service.markFilesOwnedByUserForDeletion(userId);

			expect(result).toEqual(expectedResultWhenFilesNotExists);

			expect(repo.findByOwnerUserId).toBeCalledWith(userId);
		});

		describe('should properly mark files for deletion', () => {
			it('in case of just a single file owned by given user', async () => {
				const { entity1, expectedResultWhenOneFileExists, userId } = setup();
				repo.findByOwnerUserId.mockResolvedValueOnce([entity1]);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(expectedResultWhenOneFileExists);
				verifyEntityChanges(entity1);

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity1]);
			});

			it('in case of many files owned by the user', async () => {
				const { entities, expectedResultWhenManyFilesExists, userId } = setup();
				repo.findByOwnerUserId.mockResolvedValueOnce(entities);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(expectedResultWhenManyFilesExists);
				entities.forEach((entity) => verifyEntityChanges(entity));

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
			});
		});
	});

	describe('deleteUserData', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const entity1 = fileEntityFactory.buildWithId({ ownerId: userId });
			const entity2 = fileEntityFactory.buildWithId({ ownerId: userId });
			const entity3 = fileEntityFactory.buildWithId({ ownerId: userId });
			const userPermission = filePermissionEntityFactory.build({ refId: userId });

			const entity4 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
				creatorId: userId,
			});
			const entity5 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
				creatorId: userId,
			});
			const entity6 = fileEntityFactory.buildWithId({
				permissions: [userPermission],
			});

			const expectedResultForMarkingFiles = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [entity1.id, entity2.id, entity3.id]),
			]);

			const expectedResultForRemoveUserPermission = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [entity4.id, entity5.id, entity6.id]),
			]);

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 6, [
					entity1.id,
					entity2.id,
					entity3.id,
					entity4.id,
					entity5.id,
					entity6.id,
				]),
			]);

			return {
				expectedResult,
				expectedResultForMarkingFiles,
				expectedResultForRemoveUserPermission,
				userId,
			};
		};

		describe('when deleteUserData', () => {
			it('should call markFilesOwnedByUserForDeletion with userId', async () => {
				const { userId, expectedResultForMarkingFiles } = setup();
				jest.spyOn(service, 'markFilesOwnedByUserForDeletion').mockResolvedValueOnce(expectedResultForMarkingFiles);

				await service.deleteUserData(userId);

				expect(service.markFilesOwnedByUserForDeletion).toHaveBeenCalledWith(userId);
			});

			it('should call removeUserPermissionsOrCreatorReferenceToAnyFiles with userId', async () => {
				const { userId, expectedResultForRemoveUserPermission } = setup();

				jest
					.spyOn(service, 'removeUserPermissionsOrCreatorReferenceToAnyFiles')
					.mockResolvedValueOnce(expectedResultForRemoveUserPermission);

				await service.deleteUserData(userId);

				expect(service.removeUserPermissionsOrCreatorReferenceToAnyFiles).toHaveBeenCalledWith(userId);
			});

			it('should return domainOperation object with information about deleted user data', async () => {
				const { userId, expectedResult, expectedResultForMarkingFiles, expectedResultForRemoveUserPermission } =
					setup();

				jest.spyOn(service, 'markFilesOwnedByUserForDeletion').mockResolvedValueOnce(expectedResultForMarkingFiles);
				jest
					.spyOn(service, 'removeUserPermissionsOrCreatorReferenceToAnyFiles')
					.mockResolvedValueOnce(expectedResultForRemoveUserPermission);

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILE;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
