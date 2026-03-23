import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { DeletionBatchRepo, DeletionBatchUsersRepo } from '../../repo';
import { DeletionBatch, DeletionRequest } from '../do';
import { BatchStatus, DomainName, StatusModel } from '../types';
import {
	CreateDeletionBatchParams,
	DeletionBatchDetails,
	DeletionBatchService,
	DeletionBatchSummary,
} from './deletion-batch.service';
import { DeletionRequestService } from './deletion-request.service';

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

			const newBatch: CreateDeletionBatchParams = {
				name: params.name,
				targetRefDomain: params.targetRefDomain,
				targetRefIds: validUserIds,
			};

			deletionBatchUsersRepo.groupUserIdsByAllowedRoles.mockResolvedValue({
				withAllowedRole: validUserIds.map((id) => {
					return { id, roleIds: validUserIds };
				}),
				withoutAllowedRole: skippedIds.map((id) => {
					return { id, roleIds: skippedIds };
				}),
			});

			const expectedSummary: DeletionBatchSummary = {
				id: expect.any(String),
				name: newBatch.name,
				status: BatchStatus.CREATED,
				validUsers: validUserIds.length,
				invalidUsers: invalidIds.length,
				skippedUsers: skippedIds.length,
				createdAt: expect.any(Date) as unknown as Date,
				updatedAt: expect.any(Date) as unknown as Date,
			};

			return { params, validUserIds, invalidIds, skippedIds, newBatch, expectedSummary };
		};

		it('should call repo to save a new deletion batch', async () => {
			const { params, newBatch } = setup();

			await service.createDeletionBatch(params);

			expect(deletionBatchRepo.save).toHaveBeenCalledWith(expect.objectContaining(newBatch));
		});

		it('should return a new deletion batch summary', async () => {
			const { params, expectedSummary } = setup();

			const result = await service.createDeletionBatch(params);

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
				invalidIds: [new ObjectId().toHexString()],
				skippedIds: [new ObjectId().toHexString()],
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

			deletionRequestService.getStatusOfDeletionRequestBatch.mockResolvedValue({
				pending: deletionRequests.map((r) => r.targetRefId),
				failed: [],
				success: [],
			});

			return { batch, deletionRequests };
		};

		it('should call repo to find deletion batch', async () => {
			const { batch } = setup();

			await service.getDeletionBatchDetails(batch.id);

			expect(deletionBatchRepo.findById).toHaveBeenCalledWith(batch.id);
		});

		it('should call deletionRequestService getStatusOfDeletionRequestBatch', async () => {
			const { batch } = setup();

			await service.getDeletionBatchDetails(batch.id);

			expect(deletionRequestService.getStatusOfDeletionRequestBatch).toHaveBeenCalledWith(batch.id);
		});

		it('should return deletion batch details', async () => {
			const { batch, deletionRequests } = setup();

			const result = await service.getDeletionBatchDetails(batch.id);

			const expectedDetails: DeletionBatchDetails = {
				id: batch.id,
				name: batch.name,
				status: batch.status,
				validUsers: batch.targetRefIds,
				invalidUsers: batch.invalidIds,
				skippedUsers: batch.skippedIds,
				pendingDeletions: deletionRequests.map((r) => r.targetRefId),
				failedDeletions: [],
				successfulDeletions: [],
				createdAt: batch.createdAt,
				updatedAt: batch.updatedAt,
			};

			expect(result).toEqual(expect.objectContaining(expectedDetails));
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

			const expectedSummary: DeletionBatchSummary = {
				id: batch.id,
				name: batch.name,
				status: batch.status,
				validUsers: batch.targetRefIds.length,
				invalidUsers: batch.invalidIds.length,
				skippedUsers: batch.skippedIds.length,
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
				createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago,
				updatedAt: new Date(),
			});
			deletionBatchRepo.findById.mockResolvedValueOnce(batch);
			deletionBatchRepo.updateStatus.mockResolvedValueOnce(undefined);

			deletionRequestService.createDeletionRequest.mockResolvedValue({
				requestId: new ObjectId().toHexString(),
				deletionPlannedAt: new Date(),
			});

			deletionBatchUsersRepo.groupUserIdsByAllowedRoles.mockResolvedValue({
				withAllowedRole: [{ id: batch.targetRefIds[0], roleIds: [new ObjectId().toHexString()] }],
				withoutAllowedRole: [],
			});

			const expectedSummary: DeletionBatchSummary = {
				id: batch.id,
				name: batch.name,
				status: BatchStatus.DELETION_REQUESTED,
				validUsers: batch.targetRefIds.length,
				invalidUsers: batch.invalidIds.length,
				skippedUsers: batch.skippedIds.length,
				createdAt: batch.createdAt,
				updatedAt: batch.updatedAt,
			};

			return { batch, expectedSummary };
		};

		it('should call deletionRequestService', async () => {
			const { batch } = setup();

			await service.requestDeletionForBatch(batch.id, new Date());

			expect(deletionRequestService.createMultipleDeletionRequests).toHaveBeenCalledWith(
				batch.id,
				batch.targetRefIds,
				batch.targetRefDomain,
				expect.any(Date)
			);
		});

		describe('when batch is older than 60 minutes', () => {
			it('should revalidate user ids and update batch', async () => {
				const { batch } = setup();

				const updateSpy = jest.spyOn(batch, 'updateIds');

				await service.requestDeletionForBatch(batch.id, new Date());

				expect(updateSpy).toHaveBeenCalledWith({
					targetRefIds: expect.any(Array),
					invalidIds: expect.any(Array),
					skippedIds: expect.any(Array),
				});

				expect(deletionBatchRepo.save).toHaveBeenCalledWith(batch);
			});
		});

		it('should call repo to update batch', async () => {
			const { batch } = setup();

			await service.requestDeletionForBatch(batch.id, new Date());

			expect(deletionBatchRepo.save).toHaveBeenCalledWith(batch);
		});

		it('should return summary', async () => {
			const { batch, expectedSummary } = setup();

			const result = await service.requestDeletionForBatch(batch.id, new Date());

			expect(result).toEqual(expectedSummary);
		});
	});
});
