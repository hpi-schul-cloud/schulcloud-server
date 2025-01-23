import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createConfigModuleOptions } from '@shared/common';
import { setupEntities } from '@testing/setup-entities';
import { ObjectId } from 'bson';
import { DeletionRequestRepo } from '../../repo';
import { deletionRequestFactory, deletionTestConfig } from '../testing';
import { DomainName, StatusModel } from '../types';
import { DeletionRequestService } from './deletion-request.service';

describe(DeletionRequestService.name, () => {
	let module: TestingModule;
	let service: DeletionRequestService;
	let deletionRequestRepo: DeepMocked<DeletionRequestRepo>;
	let configService: DeepMocked<ConfigService>;

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
		configService = module.get(ConfigService);

		await setupEntities();

		jest.useFakeTimers();
		jest.setSystemTime(new Date());
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

	describe('findAllItemsToExecute', () => {
		describe('when finding all deletionRequests for execution', () => {
			const setup = () => {
				const limit = 100;

				const dateInPast = new Date();
				dateInPast.setDate(dateInPast.getDate() - 1);

				const thresholdOlderMs = configService.get<number>('ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS') ?? 100;
				const thresholdNewerMs = configService.get<number>('ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS') ?? 1000;

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
