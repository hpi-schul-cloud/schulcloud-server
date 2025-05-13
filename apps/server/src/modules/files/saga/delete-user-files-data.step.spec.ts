import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { fileEntityFactory, filePermissionEntityFactory } from '../entity/testing';
import { FilesRepo } from '../repo';
import { DeleteUserFilesDataStep } from './delete-user-files-data.step';
import { FileEntity } from '../entity';

describe(DeleteUserFilesDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserFilesDataStep;
	let repo: DeepMocked<FilesRepo>;
	// let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserFilesDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
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

		step = module.get(DeleteUserFilesDataStep);
		repo = module.get(FilesRepo);
		// logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserFilesDataStep(sagaService, createMock<FilesRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.FILES, step);
		});
	});

	describe('execute', () => {
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

			const expectedResultForMarkingFiles = StepOperationReportBuilder.build(StepOperationType.UPDATE, 3, [
				entity1.id,
				entity2.id,
				entity3.id,
			]);

			const expectedResultForRemoveUserPermission = StepOperationReportBuilder.build(StepOperationType.UPDATE, 3, [
				entity4.id,
				entity5.id,
				entity6.id,
			]);

			const expectedResult = StepReportBuilder.build(ModuleName.FILES, [
				expectedResultForMarkingFiles,
				expectedResultForRemoveUserPermission,
			]);

			return {
				expectedResult,
				expectedResultForMarkingFiles,
				expectedResultForRemoveUserPermission,
				userId,
			};
		};

		describe('when executing', () => {
			it('should call markFilesOwnedByUserForDeletion with userId', async () => {
				const { userId, expectedResultForMarkingFiles } = setup();
				jest.spyOn(step, 'markFilesOwnedByUserForDeletion').mockResolvedValueOnce(expectedResultForMarkingFiles);

				await step.execute({ userId });

				expect(step.markFilesOwnedByUserForDeletion).toHaveBeenCalledWith(userId);
			});

			it('should call removeUserPermissionsOrCreatorReferenceToAnyFiles with userId', async () => {
				const { userId, expectedResultForRemoveUserPermission } = setup();

				jest
					.spyOn(step, 'removeUserPermissionsOrCreatorReferenceToAnyFiles')
					.mockResolvedValueOnce(expectedResultForRemoveUserPermission);

				await step.execute({ userId });

				expect(step.removeUserPermissionsOrCreatorReferenceToAnyFiles).toHaveBeenCalledWith(userId);
			});

			it('should return domainOperation object with information about deleted user data', async () => {
				const { userId, expectedResult, expectedResultForMarkingFiles, expectedResultForRemoveUserPermission } =
					setup();

				jest.spyOn(step, 'markFilesOwnedByUserForDeletion').mockResolvedValueOnce(expectedResultForMarkingFiles);
				jest
					.spyOn(step, 'removeUserPermissionsOrCreatorReferenceToAnyFiles')
					.mockResolvedValueOnce(expectedResultForRemoveUserPermission);

				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
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

			const expectedResultWhenFilesNotExists = StepOperationReportBuilder.build(StepOperationType.UPDATE, 0, []);

			const expectedResultWhenOneFileExists = StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [
				entity1.id,
			]);

			const expectedResultWhenManyFilesExists = StepOperationReportBuilder.build(StepOperationType.UPDATE, 3, [
				entity1.id,
				entity2.id,
				entity3.id,
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
			const result = await step.markFilesOwnedByUserForDeletion(userId);

			expect(result).toEqual(expectedResultWhenFilesNotExists);

			expect(repo.findByOwnerUserId).toBeCalledWith(userId);
		});

		describe('should properly mark files for deletion', () => {
			it('in case of just a single file owned by given user', async () => {
				const { entity1, expectedResultWhenOneFileExists, userId } = setup();
				repo.findByOwnerUserId.mockResolvedValueOnce([entity1]);

				const result = await step.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(expectedResultWhenOneFileExists);
				verifyEntityChanges(entity1);

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity1]);
			});

			it('in case of many files owned by the user', async () => {
				const { entities, expectedResultWhenManyFilesExists, userId } = setup();
				repo.findByOwnerUserId.mockResolvedValueOnce(entities);

				const result = await step.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(expectedResultWhenManyFilesExists);
				entities.forEach((entity) => verifyEntityChanges(entity));

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
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

			const expectedResultWhenFilesNotExists = StepOperationReportBuilder.build(StepOperationType.UPDATE, 0, []);

			const expectedResultWhenFilesExistsWithOnlyUserId = StepOperationReportBuilder.build(
				StepOperationType.UPDATE,
				3,
				[entity1.id, entity2.id, entity3.id]
			);

			const expectedResultWhenManyFilesExistsWithOtherUsers = StepOperationReportBuilder.build(
				StepOperationType.UPDATE,
				3,
				[entity4.id, entity5.id, entity6.id]
			);

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

			const result = await step.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

			expect(result).toEqual(expectedResultWhenFilesNotExists);

			expect(repo.findByPermissionRefIdOrCreatorId).toBeCalledWith(userId);
		});

		describe('should properly remove user permissions, creatorId reference', () => {
			it('in case of just a single file (permission) accessible by given user and couple of files created', async () => {
				const { entity1, entity2, entity3, expectedResultWhenFilesExistsWithOnlyUserId, userId, userPermission } =
					setup();

				repo.findByPermissionRefIdOrCreatorId.mockResolvedValueOnce([entity1, entity2, entity3]);

				const result = await step.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

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

				const result = await step.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId);

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
});
