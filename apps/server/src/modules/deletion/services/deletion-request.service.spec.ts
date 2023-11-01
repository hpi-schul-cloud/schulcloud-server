import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { DeletionRequestService } from './deletion-request.service';
import { DeletionRequestRepo } from '../repo';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

describe(DeletionRequestService.name, () => {
	let module: TestingModule;
	let service: DeletionRequestService;
	let deletionRequestRepo: DeepMocked<DeletionRequestRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
				const itemId = '653e4833cc39e5907a1e18d2';
				const domain = DeletionDomainModel.USER;

				return { itemId, domain };
			};

			it('should call deletionRequestRepo.create', async () => {
				const { itemId, domain } = setup();

				await service.createDeletionRequest(itemId, domain);

				expect(deletionRequestRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						domain,
						deleteAfter: expect.any(Date),
						itemId,
						status: DeletionStatusModel.REGISTERED,
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

	describe('findAllItemsByDeletionDate', () => {
		describe('when finding all deletionRequests for execution', () => {
			const setup = () => {
				const dateInPast = new Date();
				dateInPast.setDate(dateInPast.getDate() - 1);
				const deletionRequest1 = deletionRequestFactory.build({ deleteAfter: dateInPast });
				const deletionRequest2 = deletionRequestFactory.build({ deleteAfter: dateInPast });

				deletionRequestRepo.findAllItemsByDeletionDate.mockResolvedValue([deletionRequest1, deletionRequest2]);

				const deletionRequests = [deletionRequest1, deletionRequest2];
				return { deletionRequests };
			};

			it('should call deletionRequestRepo.findAllItemsByDeletionDate', async () => {
				await service.findAllItemsByDeletionDate();

				expect(deletionRequestRepo.findAllItemsByDeletionDate).toBeCalled();
			});

			it('should return array of two deletionRequests with date smaller than today', async () => {
				const { deletionRequests } = setup();
				const result = await service.findAllItemsByDeletionDate();

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
