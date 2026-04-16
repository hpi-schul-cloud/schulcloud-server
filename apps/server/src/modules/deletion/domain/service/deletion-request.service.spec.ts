import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from '../../deletion.config';
import { DeletionRequestRepo } from '../../repo';
import { DeletionRequestEntity } from '../../repo/entity';
import { deletionRequestFactory } from '../testing';
import { DomainName, StatusModel } from '../types';
import { DeletionRequestService } from './deletion-request.service';

describe(DeletionRequestService.name, () => {
	let module: TestingModule;
	let service: DeletionRequestService;
	let deletionRequestRepo: DeepMocked<DeletionRequestRepo>;
	let config: DeletionConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionRequestService,
				{
					provide: DeletionRequestRepo,
					useValue: createMock<DeletionRequestRepo>(),
				},
				{ provide: DELETION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = module.get(DeletionRequestService);
		deletionRequestRepo = module.get(DeletionRequestRepo);
		config = module.get(DELETION_CONFIG_TOKEN);

		await setupEntities([DeletionRequestEntity]);

		jest.useFakeTimers().setSystemTime(new Date());
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('should be defined', () => {
			expect(service).toBeDefined();
		});
	});

	describe('createDeletionRequest', () => {
		describe('when creating a deletionRequest', () => {
			const setup = () => {
				const targetRefId = '653e4833cc39e5907a1e18d2';
				const targetRefDomain = DomainName.USER;
				const deleteAfter = new Date();
				const minutes = 60;
				deleteAfter.setMinutes(deleteAfter.getMinutes() + minutes);

				return { targetRefId, targetRefDomain, deleteAfter };
			};

			it('should call deletionRequestRepo.create', async () => {
				const { targetRefId, targetRefDomain, deleteAfter } = setup();

				await service.createDeletionRequest(targetRefId, targetRefDomain, deleteAfter);

				expect(deletionRequestRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						targetRefDomain,
						deleteAfter,
						targetRefId,
						status: StatusModel.REGISTERED,
					})
				);
			});
		});
	});

	describe('findById', () => {
		describe('when finding by deletionRequestId', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();
				const deletionRequest = deletionRequestFactory.build({ id: deletionRequestId });

				deletionRequestRepo.findById.mockResolvedValue(deletionRequest);

				return { deletionRequestId, deletionRequest };
			};

			it('should call deletionRequestRepo.findById', async () => {
				const { deletionRequestId } = setup();

				await service.findById(deletionRequestId);

				expect(deletionRequestRepo.findById).toBeCalledWith(deletionRequestId);
			});

			it('should return deletionRequest', async () => {
				const { deletionRequestId, deletionRequest } = setup();

				const result = await service.findById(deletionRequestId);

				expect(result).toEqual(deletionRequest);
			});
		});
	});

	describe('findByIds', () => {
		describe('when finding by deletionRequestIds', () => {
			const setup = () => {
				const deletionRequestIds = [new ObjectId().toHexString(), new ObjectId().toHexString()];
				const deletionRequest1 = deletionRequestFactory.build({ id: deletionRequestIds[0] });
				const deletionRequest2 = deletionRequestFactory.build({ id: deletionRequestIds[1] });

				deletionRequestRepo.findByIds.mockResolvedValue([deletionRequest1, deletionRequest2]);

				return { deletionRequestIds, deletionRequest1, deletionRequest2 };
			};

			it('should call deletionRequestRepo.findByIds', async () => {
				const { deletionRequestIds } = setup();

				await service.findByIds(deletionRequestIds);

				expect(deletionRequestRepo.findByIds).toBeCalledWith(deletionRequestIds);
			});

			it('should return array of two deletionRequests', async () => {
				const { deletionRequest1, deletionRequest2 } = setup();

				const result = await service.findByIds([deletionRequest1.id, deletionRequest2.id]);

				expect(result).toHaveLength(2);
				expect(result).toEqual([deletionRequest1, deletionRequest2]);
			});
		});
	});

	describe('findAllItemsToExecute', () => {
		describe('when finding all deletionRequests for execution', () => {
			const setup = () => {
				const limit = 100;

				const dateInPast = new Date();
				dateInPast.setDate(dateInPast.getDate() - 1);

				const thresholdOlderMs = config.adminApiDeletionModificationThresholdMs;
				const thresholdNewerMs = config.adminApiDeletionConsiderFailedAfterMs;

				const olderThan = new Date(Date.now() - thresholdOlderMs);
				const newerThan = new Date(Date.now() - thresholdNewerMs);

				const deletionRequest1 = deletionRequestFactory.build({ deleteAfter: dateInPast });
				const deletionRequest2 = deletionRequestFactory.build({ deleteAfter: dateInPast });

				deletionRequestRepo.findAllItems.mockResolvedValue([deletionRequest1, deletionRequest2]);

				const deletionRequests = [deletionRequest1, deletionRequest2];

				return { deletionRequests, limit, olderThan, newerThan };
			};

			it('should call deletionRequestRepo.findAllItemsToExecution with required parameter', async () => {
				const { limit } = setup();

				await service.findAllItemsToExecute(limit);

				expect(deletionRequestRepo.findAllItems).toBeCalledWith(limit);
			});

			it('should return array of two deletionRequests to execute', async () => {
				const { deletionRequests, limit } = setup();
				const result = await service.findAllItemsToExecute(limit);

				expect(result).toHaveLength(2);
				expect(result).toEqual(deletionRequests);
			});
		});
	});

	describe('markDeletionRequestAsExecuted', () => {
		describe('when mark deletionRequest as executed', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();

				return { deletionRequestId };
			};

			it('should call deletionRequestRepo.markDeletionRequestAsExecuted', async () => {
				const { deletionRequestId } = setup();
				await service.markDeletionRequestAsExecuted(deletionRequestId);

				expect(deletionRequestRepo.markDeletionRequestAsExecuted).toBeCalledWith(deletionRequestId);
			});
		});
	});

	describe('markDeletionRequestAsFailed', () => {
		describe('when mark deletionRequest as failed', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();

				return { deletionRequestId };
			};

			it('should call deletionRequestRepo.markDeletionRequestAsExecuted', async () => {
				const { deletionRequestId } = setup();
				await service.markDeletionRequestAsFailed(deletionRequestId);

				expect(deletionRequestRepo.markDeletionRequestAsFailed).toBeCalledWith(deletionRequestId);
			});
		});
	});

	describe('markDeletionRequestAsPending', () => {
		describe('when mark deletionRequest as pending', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();

				return { deletionRequestId };
			};

			it('should call deletionRequestRepo.markDeletionRequestAsPending', async () => {
				const { deletionRequestId } = setup();
				await service.markDeletionRequestAsPending(deletionRequestId);

				expect(deletionRequestRepo.markDeletionRequestAsPending).toBeCalledWith(deletionRequestId);
			});
		});
	});

	describe('deleteById', () => {
		describe('when deleting deletionRequest', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build({
					id: new ObjectId().toHexString(),
					targetRefDomain: DomainName.USER,
				});

				deletionRequestRepo.findById.mockResolvedValueOnce(deletionRequest);

				return { deletionRequestId: deletionRequest.id, deletionRequest };
			};

			it('should call deletionRequestRepo.findAllItemsByDeletionDate', async () => {
				const { deletionRequestId } = setup();
				await service.deleteById(deletionRequestId);

				expect(deletionRequestRepo.deleteById).toBeCalledWith(deletionRequestId);
			});
		});
	});

	describe('getStatusOfDeletionRequestBatch', () => {
		describe('when getting status of deletionRequest batch', () => {
			const setup = () => {
				const batchId = new ObjectId().toHexString();
				const pendingIds = [new ObjectId().toHexString()];
				const failedIds = [new ObjectId().toHexString()];
				const successIds = [new ObjectId().toHexString()];

				deletionRequestRepo.groupTargetRefIdsByBatchAndStatus.mockResolvedValue([
					{ status: StatusModel.PENDING, targetRefIds: pendingIds },
					{ status: StatusModel.FAILED, targetRefIds: failedIds },
					{ status: StatusModel.SUCCESS, targetRefIds: successIds },
				]);

				return { batchId, pendingIds, failedIds, successIds };
			};

			it('should call deletionRequestRepo.groupTargetRefIdsByBatchAndStatus', async () => {
				const { batchId } = setup();
				await service.getStatusOfDeletionRequestBatch(batchId);

				expect(deletionRequestRepo.groupTargetRefIdsByBatchAndStatus).toBeCalledWith(batchId);
			});

			it('should return grouped targetRefIds by status', async () => {
				const { batchId, pendingIds, failedIds, successIds } = setup();

				const result = await service.getStatusOfDeletionRequestBatch(batchId);

				expect(result).toEqual({
					pending: pendingIds,
					failed: failedIds,
					success: successIds,
				});
			});
		});
	});
});
