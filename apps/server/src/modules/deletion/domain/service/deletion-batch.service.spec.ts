import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { CreateDeletionBatchParams, DeletionBatchService, DeletionBatchSummary } from './deletion-batch.service';
import { DeletionBatchRepo, DeletionBatchUsersRepo, UsersCountByRole } from '../../repo';
import { DeletionRequestService } from './deletion-request.service';
import { DeletionBatch, DeletionRequest } from '../do';
import { BatchStatus, DomainName, StatusModel } from '../types';

describe('DeletionBatchService', () => {
	let service: DeletionBatchService;
	let deletionBatchRepo: DeepMocked<DeletionBatchRepo>;
	let deletionBatchUsersRepo: DeepMocked<DeletionBatchUsersRepo>;
	let deletionRequestService: DeepMocked<DeletionRequestService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeletionBatchService,
				{
					provide: DeletionBatchRepo,
					useValue: createMock<DeletionBatchRepo>(),
				},
				{
					provide: DeletionBatchUsersRepo,
					useValue: createMock<DeletionBatchUsersRepo>(),
				},
				{
					provide: DeletionRequestService,
					useValue: createMock<DeletionRequestService>(),
				},
			],
		}).compile();

		service = module.get<DeletionBatchService>(DeletionBatchService);
		deletionBatchRepo = module.get(DeletionBatchRepo);
		deletionBatchUsersRepo = module.get(DeletionBatchUsersRepo);
		deletionRequestService = module.get(DeletionRequestService);
	});

	describe('findById', () => {
		const setup = () => {
			const batchId = new ObjectId().toHexString();
			const batch = new DeletionBatch({
				id: batchId,
				name: 'Test Batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			deletionBatchRepo.findById.mockResolvedValueOnce(batch);
			return { batchId, batch };
		};

		it('should return a deletion batch by id', async () => {
			const { batchId, batch } = setup();
			const result = await service.findById(batchId);
			expect(result).toEqual(batch);
			expect(deletionBatchRepo.findById).toHaveBeenCalledWith(batchId);
		});
	});

	describe('createDeletionBatch', () => {
		const setup = () => {
			const validUserIds = [new ObjectId().toHexString()];
			const invalidIds = [new ObjectId().toHexString()];
			const skippedIds = [new ObjectId().toHexString()];

			const params: CreateDeletionBatchParams = {
				name: 'Test Batch',
				targetRefDomain: DomainName.USER,
				targetRefIds: [...validUserIds, ...invalidIds, ...skippedIds],
			};

			const newBatch = {
				name: params.name,
				status: BatchStatus.CREATED,
				targetRefDomain: params.targetRefDomain,
				targetRefIds: validUserIds,
				invalidIds,
				skippedIds,
			};

			const expectedSummary = {
				name: newBatch.name,
				status: newBatch.status,
				usersByRole: [{ roleName: 'xxx', userCount: 1 }],
				invalidUsers: newBatch.invalidIds,
				skippedUsersByRole: [{ roleName: 'xxx', userCount: 1 }],
			};

			deletionBatchUsersRepo.countUsersByRole.mockResolvedValue([{ roleName: 'xxx', userCount: 1 }]);

			return { params, validUserIds, invalidIds, skippedIds, newBatch, expectedSummary };
		};

		it('should call repo to save a new deletion batch', async () => {
			const { params, validUserIds, invalidIds, skippedIds, newBatch } = setup();

			await service.createDeletionBatch(params, validUserIds, invalidIds, skippedIds);

			expect(deletionBatchRepo.save).toHaveBeenCalledWith(expect.objectContaining(newBatch));
		});

		it('should return a new deletion batch summary', async () => {
			const { params, validUserIds, invalidIds, skippedIds, expectedSummary } = setup();

			const result = await service.createDeletionBatch(params, validUserIds, invalidIds, skippedIds);

			expect(result).toEqual(expect.objectContaining(expectedSummary));
		});
	});

	describe('deleteDeletionBatch', () => {
		const setup = () => {
			const batchId = new ObjectId().toHexString();
			const batch = new DeletionBatch({
				id: batchId,
				name: 'Test Batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			deletionBatchRepo.findById.mockResolvedValueOnce(batch);
			return { batchId, batch };
		};

		it('should delete a deletion batch by id', async () => {
			const { batchId, batch } = setup();

			await service.deleteDeletionBatch(batchId);

			expect(deletionBatchRepo.delete).toHaveBeenCalledWith(batch);
		});
	});

	describe('getDeletionBatchDetails', () => {
		const setup = () => {
			const batch = new DeletionBatch({
				id: new ObjectId().toHexString(),
				name: 'Test Batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const deletionRequests = [
				new DeletionRequest({
					id: new ObjectId().toHexString(),
					targetRefId: new ObjectId().toHexString(),
					status: StatusModel.PENDING,
					deleteAfter: new Date(),
					targetRefDomain: DomainName.USER,
				}),
			];

			deletionBatchRepo.findById.mockResolvedValueOnce(batch);

			deletionRequestService.findByStatusAndTargetRefId.mockResolvedValue(deletionRequests);

			const skippedUsers = [{ roleName: 'student', userIds: [new ObjectId().toHexString()] }];
			deletionBatchUsersRepo.getUsersByRole.mockResolvedValueOnce(skippedUsers);

			return { batch, deletionRequests, skippedUsers };
		};

		it('should call repo to find deletion batch', async () => {
			const { batch } = setup();

			await service.getDeletionBatchDetails(batch.id);

			expect(deletionBatchRepo.findById).toHaveBeenCalledWith(batch.id);
		});

		it('should call deletionRequestService findByStatusAndTargetRefId', async () => {
			const { batch } = setup();

			await service.getDeletionBatchDetails(batch.id);

			expect(deletionRequestService.findByStatusAndTargetRefId).toHaveBeenCalledTimes(3);

			expect(deletionRequestService.findByStatusAndTargetRefId).toHaveBeenCalledWith(
				StatusModel.PENDING,
				batch.targetRefIds
			);
			expect(deletionRequestService.findByStatusAndTargetRefId).toHaveBeenCalledWith(
				StatusModel.FAILED,
				batch.targetRefIds
			);
			expect(deletionRequestService.findByStatusAndTargetRefId).toHaveBeenCalledWith(
				StatusModel.SUCCESS,
				batch.targetRefIds
			);
		});

		it('should call deletionBatchUsersRepo getUsersByRole', async () => {
			const { batch } = setup();

			await service.getDeletionBatchDetails(batch.id);

			expect(deletionBatchUsersRepo.getUsersByRole).toHaveBeenCalledWith(batch.skippedIds);
		});

		it('should return deletion batch details', async () => {
			const { batch } = setup();

			const result = await service.getDeletionBatchDetails(batch.id);

			expect(result).toEqual(
				expect.objectContaining({
					id: batch.id,
					pendingDeletions: expect.any(Array),
					failedDeletions: expect.any(Array),
					successfulDeletions: expect.any(Array),
					invalidIds: expect.any(Array),
					skippedUsersByRole: expect.any(Array),
				})
			);
		});
	});

	describe('getDeletionBatchSummaries', () => {
		const setup = () => {
			const batch = new DeletionBatch({
				id: new ObjectId().toHexString(),
				name: 'Test Batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [new ObjectId().toHexString()],
				skippedIds: [new ObjectId().toHexString()],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const batches = [batch];
			deletionBatchRepo.findDeletionBatches.mockResolvedValueOnce(new Page<DeletionBatch>(batches, 1));

			const mockCount: UsersCountByRole[] = [{ roleName: 'xxx', userCount: 1 }];
			deletionBatchUsersRepo.countUsersByRole.mockResolvedValue(mockCount);

			const expectedSummary: DeletionBatchSummary = {
				id: batch.id,
				name: batch.name,
				status: batch.status,
				invalidUsers: batch.invalidIds,
				usersByRole: mockCount,
				skippedUsersByRole: mockCount,
				createdAt: batch.createdAt,
				updatedAt: batch.updatedAt,
			};

			const paginationParams: IFindOptions<DeletionBatchSummary> = {};
			return { batches, paginationParams, expectedSummary };
		};

		it('should call repo to find deletion batches', async () => {
			const { paginationParams } = setup();
			await service.getDeletionBatchSummaries(paginationParams);
			expect(deletionBatchRepo.findDeletionBatches).toHaveBeenCalled();
		});

		it('should return paginated deletion batch summaries', async () => {
			const { paginationParams, expectedSummary } = setup();
			const result = await service.getDeletionBatchSummaries(paginationParams);
			expect(result.data).toEqual([expectedSummary]);
		});
	});

	describe('requestDeletionForBatch', () => {
		const setup = () => {
			const batchId = new ObjectId().toHexString();
			const batch = new DeletionBatch({
				id: batchId,
				name: 'Test Batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			deletionBatchRepo.findById.mockResolvedValueOnce(batch);
			deletionBatchRepo.updateStatus.mockResolvedValueOnce(undefined);

			deletionRequestService.createDeletionRequest.mockResolvedValue({
				requestId: new ObjectId().toHexString(),
				deletionPlannedAt: new Date(),
			});

			deletionBatchUsersRepo.countUsersByRole.mockResolvedValue([{ roleName: 'xxx', userCount: 1 }]);

			const expectedSummary: DeletionBatchSummary = {
				id: batch.id,
				name: batch.name,
				status: batch.status,
				invalidUsers: batch.invalidIds,
				usersByRole: [{ roleName: 'xxx', userCount: 1 }],
				skippedUsersByRole: [{ roleName: 'xxx', userCount: 1 }],
				createdAt: batch.createdAt,
				updatedAt: batch.updatedAt,
			};

			return { batch, expectedSummary };
		};

		it('should call deletionRequestService', async () => {
			const { batch } = setup();

			await service.requestDeletionForBatch(batch, new Date());

			expect(deletionRequestService.createDeletionRequestBatch).toHaveBeenCalledWith(
				batch.targetRefIds,
				batch.targetRefDomain,
				expect.any(Date)
			);
		});

		it('should call repo to update status', async () => {
			const { batch } = setup();

			await service.requestDeletionForBatch(batch, new Date());

			expect(deletionBatchRepo.updateStatus).toHaveBeenCalledWith(batch, BatchStatus.DELETION_REQUESTED);
		});

		it('should return summary', async () => {
			const { batch, expectedSummary } = setup();

			const result = await service.requestDeletionForBatch(batch, new Date());

			expect(result).toEqual(expectedSummary);
		});
	});
});
