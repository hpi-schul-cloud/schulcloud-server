import { Test, TestingModule } from '@nestjs/testing';
import { DeletionExecutionService } from './deletion-execution.service';
import { DeletionLogService, DeletionRequestService, UserDeletionInjectionService } from './';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { DeletionRequest } from '../do';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DomainName, StatusModel } from '../types';

describe(DeletionExecutionService.name, () => {
	let service: DeletionExecutionService;
	let deletionRequestService: DeepMocked<DeletionRequestService>;
	let deletionLogService: DeepMocked<DeletionLogService>;
	let userDeletionInjectionService: DeepMocked<UserDeletionInjectionService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeletionExecutionService,
				{ provide: MikroORM, useValue: createMock<MikroORM>() },
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: DeletionRequestService, useValue: createMock<DeletionRequestService>() },
				{ provide: DeletionLogService, useValue: createMock<DeletionLogService>() },
				{ provide: UserDeletionInjectionService, useValue: createMock<UserDeletionInjectionService>() },
			],
		}).compile();

		service = module.get(DeletionExecutionService);
		deletionRequestService = module.get(DeletionRequestService);
		deletionLogService = module.get(DeletionLogService);
		userDeletionInjectionService = module.get(UserDeletionInjectionService);
	});

	describe('executeDeletionRequest', () => {
		const setup = () => {
			const deletionRequest = {
				id: 'test-id',
				targetRefId: 'target-ref-id',
				targetRefDomain: DomainName.USER,
				status: StatusModel.REGISTERED,
				createdAt: new Date(),
				updatedAt: new Date(),
				deleteAfter: new Date(),
			} as unknown as DeletionRequest;

			const mockService = {
				deleteUserData: jest.fn().mockResolvedValue([{ success: true }]),
			};

			userDeletionInjectionService.getUserDeletionServices.mockReturnValueOnce([mockService]);

			return { deletionRequest, mockService };
		};

		it('should mark the deletion request as pending', async () => {
			const { deletionRequest } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionRequestService.markDeletionRequestAsPending).toHaveBeenCalledWith(deletionRequest.id);
		});

		it('should call deleteUserData for each deletion service', async () => {
			const { deletionRequest, mockService } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(mockService.deleteUserData).toHaveBeenCalledWith(deletionRequest.targetRefId);
		});

		it('should create deletion logs for successful deletions', async () => {
			const { deletionRequest, mockService } = setup();

			mockService.deleteUserData.mockResolvedValue([{ success: true, details: 'log-details' }]);

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionLogService.createDeletionLog).toHaveBeenCalledWith(
				deletionRequest.id,
				expect.objectContaining({ success: true, details: 'log-details' })
			);
		});

		it('should mark the deletion request as failed if any service fails', async () => {
			const { deletionRequest, mockService } = setup();

			mockService.deleteUserData.mockRejectedValue(new Error('Service failed'));

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionRequestService.markDeletionRequestAsFailed).toHaveBeenCalledWith(deletionRequest.id);
		});

		it('should mark the deletion request as executed if all services succeed', async () => {
			const { deletionRequest } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionRequestService.markDeletionRequestAsExecuted).toHaveBeenCalledWith(deletionRequest.id);
		});
	});
});
