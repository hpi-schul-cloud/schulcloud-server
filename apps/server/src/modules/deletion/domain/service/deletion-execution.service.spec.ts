import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@core/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleName, SagaService, StepOperationType } from '@modules/saga';
import { DeletionLogService, DeletionRequestService } from '.';
import { DeletionRequest } from '../do';
import { DomainName, StatusModel } from '../types';
import { DeletionErrorLoggableException } from '../loggable-exception';
import { DeletionExecutionService } from './deletion-execution.service';

describe(DeletionExecutionService.name, () => {
	let service: DeletionExecutionService;
	let sagaService: DeepMocked<SagaService>;
	let deletionRequestService: DeepMocked<DeletionRequestService>;
	let deletionLogService: DeepMocked<DeletionLogService>;
	let logger: DeepMocked<Logger>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeletionExecutionService,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: DeletionRequestService,
					useValue: createMock<DeletionRequestService>(),
				},
				{
					provide: DeletionLogService,
					useValue: createMock<DeletionLogService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(DeletionExecutionService);
		sagaService = module.get(SagaService);
		deletionRequestService = module.get(DeletionRequestService);
		deletionLogService = module.get(DeletionLogService);
		logger = module.get(Logger);
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

			const report = {
				moduleName: ModuleName.ACCOUNT,
				operations: [{ operation: StepOperationType.DELETE, count: 1, refs: ['id1'] }],
			};

			const expectedReport = {
				deletionRequestId: deletionRequest.id,
				domainDeletionReport: {
					domain: 'account',
					operations: [
						{
							operation: 'delete',
							count: 1,
							refs: ['id1'],
						},
					],
				},
			};

			return { deletionRequest, report, expectedReport };
		};

		it('should mark the deletion request as pending', async () => {
			const { deletionRequest } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionRequestService.markDeletionRequestAsPending).toHaveBeenCalledWith(deletionRequest.id);
		});

		it('should call user deletion saga', async () => {
			const { deletionRequest } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(sagaService.executeSaga).toHaveBeenCalledWith('userDeletion', {
				userId: deletionRequest.targetRefId,
			});
		});

		it('should map the deletion report to a DomainDeletionReport', async () => {
			const { deletionRequest, report, expectedReport } = setup();

			sagaService.executeSaga.mockResolvedValue([report]);

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionLogService.createDeletionLog).toHaveBeenCalledWith([expectedReport]);
		});

		it('should create deletion logs for successful deletions', async () => {
			const { deletionRequest } = setup();

			sagaService.executeSaga.mockResolvedValue([
				{
					moduleName: ModuleName.ACCOUNT,
					operations: [{ operation: StepOperationType.DELETE, count: 1, refs: ['id1'] }],
				},
			]);

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionLogService.createDeletionLog).toHaveBeenCalledWith([
				{
					deletionRequestId: 'test-id',
					domainDeletionReport: { domain: 'account', operations: [{ count: 1, operation: 'delete', refs: ['id1'] }] },
				},
			]);
		});

		it('should mark the deletion request as failed if any service fails', async () => {
			const { deletionRequest } = setup();

			sagaService.executeSaga.mockRejectedValueOnce(new Error('Service failed'));

			try {
				await service.executeDeletionRequest(deletionRequest);
			} catch (error) {
				expect(deletionRequestService.markDeletionRequestAsFailed).toHaveBeenCalledWith(deletionRequest.id);
			}
		});

		it('should log DeletionErrorLoggableException if an error occurs', async () => {
			const { deletionRequest } = setup();

			const error = new Error('Service failed');
			sagaService.executeSaga.mockRejectedValueOnce(error);
			try {
				await service.executeDeletionRequest(deletionRequest);
			} catch (error) {
				expect(logger.warning).toHaveBeenCalledWith(
					new DeletionErrorLoggableException(
						`An error occurred during deletion execution ${deletionRequest.id}`,
						error as Error
					)
				);
			}
		});

		it('should mark the deletion request as executed if all services succeed', async () => {
			const { deletionRequest } = setup();

			await service.executeDeletionRequest(deletionRequest);

			expect(deletionRequestService.markDeletionRequestAsExecuted).toHaveBeenCalledWith(deletionRequest.id);
		});
	});

	describe('mapToDomainDeletionReport', () => {
		it('should map the report to a DomainDeletionReport', () => {
			const report = {
				moduleName: ModuleName.ACCOUNT,
				operations: [{ operation: StepOperationType.DELETE, count: 1, refs: ['id1'] }],
			};

			const result = service.mapToDomainDeletionReport(report);

			expect(result).toEqual({
				domain: 'account',
				operations: [{ operation: 'delete', count: 1, refs: ['id1'] }],
			});
		});

		it('should throw an error for an unknown module name', () => {
			const invalidModuleName = 'UNKNOWN_MODULE' as ModuleName;
			const report = {
				moduleName: invalidModuleName,
				operations: [{ operation: StepOperationType.DELETE, count: 1, refs: ['id1'] }],
			};

			expect(() => service.mapToDomainDeletionReport(report)).toThrowError(`Unknown module name: ${invalidModuleName}`);
		});

		it('should throw an error for unknonw operation type', () => {
			const invalidOperationType = 'UNKNOWN_OPERATION' as StepOperationType;
			const report = {
				moduleName: ModuleName.ACCOUNT,
				operations: [{ operation: invalidOperationType, count: 1, refs: ['id1'] }],
			};

			expect(() => service.mapToDomainDeletionReport(report)).toThrowError(
				`Unknown operation type: ${invalidOperationType}`
			);
		});
	});
});
