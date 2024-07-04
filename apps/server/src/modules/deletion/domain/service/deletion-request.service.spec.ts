import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { DeletionRequestRepo } from '../../repo';
import { deletionRequestFactory, deletionTestConfig } from '../testing';
import { DomainName, StatusModel } from '../types';
import { DeletionRequestService } from './deletion-request.service';

describe(DeletionRequestService.name, () => {
	let module: TestingModule;
	let service: DeletionRequestService;
	let deletionRequestRepo: DeepMocked<DeletionRequestRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigModule.forRoot(createConfigModuleOptions(deletionTestConfig))],
			providers: [
				DeletionRequestService,
				{
					provide: DeletionRequestRepo,
					useValue: createMock<DeletionRequestRepo>(),
				},
			],
		}).compile();

		service = module.get(DeletionRequestService);
		deletionRequestRepo = module.get(DeletionRequestRepo);

		await setupEntities();
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

				return { targetRefId, targetRefDomain };
			};

			it('should call deletionRequestRepo.create', async () => {
				const { targetRefId, targetRefDomain } = setup();

				await service.createDeletionRequest(targetRefId, targetRefDomain);

				expect(deletionRequestRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						targetRefDomain,
						deleteAfter: expect.any(Date),
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

	describe('findAllItemsToExecute', () => {
		describe('when finding all deletionRequests for execution', () => {
			const setup = () => {
				const dateInPast = new Date();
				const threshold = 1000;
				const limit = undefined;
				dateInPast.setDate(dateInPast.getDate() - 1);
				const deletionRequest1 = deletionRequestFactory.build({ deleteAfter: dateInPast });
				const deletionRequest2 = deletionRequestFactory.build({ deleteAfter: dateInPast });

				deletionRequestRepo.findAllItemsToExecution.mockResolvedValue([deletionRequest1, deletionRequest2]);

				const deletionRequests = [deletionRequest1, deletionRequest2];
				return { deletionRequests, limit, threshold };
			};

			it('should call deletionRequestRepo.findAllItemsByDeletionDate with required parameter', async () => {
				const { limit, threshold } = setup();

				await service.findAllItemsToExecute();

				expect(deletionRequestRepo.findAllItemsToExecution).toBeCalledWith(threshold, limit);
			});

			it('should return array of two deletionRequests to execute', async () => {
				const { deletionRequests } = setup();
				const result = await service.findAllItemsToExecute();

				expect(result).toHaveLength(2);
				expect(result).toEqual(deletionRequests);
			});
		});
	});

	describe('countPendingDeletionRequests', () => {
		describe('when counting all deletionRequests with status pending', () => {
			const setup = () => {
				const deletionRequestWithStatusPending = deletionRequestFactory.buildListWithId(5, {
					status: StatusModel.PENDING,
				});

				deletionRequestRepo.countPendingDeletionRequests.mockResolvedValue(deletionRequestWithStatusPending.length);

				const numberDeletionRequestsWithStatusPending = deletionRequestWithStatusPending.length;
				return { numberDeletionRequestsWithStatusPending };
			};

			it('should call deletionRequestRepo.countPendingDeletionRequests', async () => {
				await service.countPendingDeletionRequests();

				expect(deletionRequestRepo.countPendingDeletionRequests).toBeCalled();
			});

			it('should return number of deletionRequests with status pending', async () => {
				const { numberDeletionRequestsWithStatusPending } = setup();
				const result = await service.countPendingDeletionRequests();

				expect(result).toEqual(numberDeletionRequestsWithStatusPending);
			});
		});
	});
	describe('update', () => {
		describe('when updating deletionRequest', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.buildWithId();

				return { deletionRequest };
			};

			it('should call deletionRequestRepo.update', async () => {
				const { deletionRequest } = setup();
				await service.update(deletionRequest);

				expect(deletionRequestRepo.update).toBeCalledWith(deletionRequest);
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
				const deletionRequestId = new ObjectId().toHexString();

				return { deletionRequestId };
			};

			it('should call deletionRequestRepo.findAllItemsByDeletionDate', async () => {
				const { deletionRequestId } = setup();
				await service.deleteById(deletionRequestId);

				expect(deletionRequestRepo.deleteById).toBeCalledWith(deletionRequestId);
			});
		});
	});
});
