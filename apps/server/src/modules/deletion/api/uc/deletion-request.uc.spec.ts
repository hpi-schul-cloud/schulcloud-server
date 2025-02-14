import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { DeletionRequestEntity } from '@modules/deletion/repo/entity';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { DeletionConfig } from '../../deletion.config';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '../../domain/builder';
import { UserDeletedEvent } from '../../domain/event';
import { DomainDeletionReport } from '../../domain/interface';
import { DeletionLogService, DeletionRequestService } from '../../domain/service';
import { deletionLogFactory, deletionRequestFactory, deletionTestConfig } from '../../domain/testing';
import { DomainName, OperationType, StatusModel } from '../../domain/types';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyProps } from '../controller/dto';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../controller/dto/builder';
import { DeletionRequestUc } from './deletion-request.uc';

describe(DeletionRequestUc.name, () => {
	let module: TestingModule;
	let uc: DeletionRequestUc;
	let deletionRequestService: DeepMocked<DeletionRequestService>;
	let deletionLogService: DeepMocked<DeletionLogService>;
	let eventBus: DeepMocked<EventBus>;
	let configService: DeepMocked<ConfigService<DeletionConfig, true>>;

	beforeAll(async () => {
		const orm = await setupEntities([DeletionRequestEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeletionRequestUc,
				{
					provide: DeletionRequestService,
					useValue: createMock<DeletionRequestService>(),
				},
				{
					provide: DeletionLogService,
					useValue: createMock<DeletionLogService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(DeletionRequestUc);
		deletionRequestService = module.get(DeletionRequestService);
		deletionLogService = module.get(DeletionLogService);
		eventBus = module.get(EventBus);
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	describe('createDeletionRequest', () => {
		describe('when creating a deletionRequest', () => {
			const setup = () => {
				jest.useFakeTimers().setSystemTime(new Date());

				const deleteAfterMinutes = 1;
				const deletionRequestToCreate: DeletionRequestBodyProps = {
					targetRef: {
						domain: DomainName.USER,
						id: new ObjectId().toHexString(),
					},
					deleteAfterMinutes,
				};
				const deletionRequest = deletionRequestFactory.build();

				const deleteAfter = new Date();
				deleteAfter.setMinutes(deleteAfter.getMinutes() + deleteAfterMinutes);

				return {
					deletionRequestToCreate,
					deletionRequest,
					deleteAfter,
				};
			};

			it('should call the service to create the deletionRequest', async () => {
				const { deletionRequestToCreate, deleteAfter } = setup();

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(deletionRequestService.createDeletionRequest).toHaveBeenCalledWith(
					deletionRequestToCreate.targetRef.id,
					deletionRequestToCreate.targetRef.domain,
					deleteAfter
				);
			});

			it('should return the deletionRequestID and deletionPlannedAt', async () => {
				const { deletionRequestToCreate, deletionRequest } = setup();

				deletionRequestService.createDeletionRequest.mockResolvedValueOnce({
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				});

				const result = await uc.createDeletionRequest(deletionRequestToCreate);

				expect(result).toEqual({
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				});
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.ACCOUNT;
			const accountId = new ObjectId().toHexString();
			const deletionRequest = deletionRequestFactory.buildWithId({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const domainDeletionReport = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [accountId]),
			]);

			return {
				deletionRequestId,
				domainDeletionReport,
			};
		};

		describe('when DataDeletedEvent is received', () => {
			it('should call logDeletion', async () => {
				const { deletionRequestId, domainDeletionReport } = setup();

				await uc.handle({ deletionRequestId, domainDeletionReport });

				expect(deletionLogService.createDeletionLog).toHaveBeenCalledWith(deletionRequestId, domainDeletionReport);
			});
		});
	});

	describe('executeDeletionRequests', () => {
		describe('when deletionRequests to execute exists', () => {
			const setup = (noDelay = false) => {
				deletionRequestService.findInProgressCount.mockResolvedValue(1);

				configService.get.mockImplementation((key) => {
					if (key === 'ADMIN_API__DELETION_DELETE_AFTER_MINUTES') {
						return 1;
					}
					if (key === 'ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS') {
						return 100;
					}
					if (key === 'ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS') {
						return 1000;
					}
					if (key === 'ADMIN_API__DELETION_MAX_CONCURRENT_DELETION_REQUESTS') {
						return 2;
					}
					if (key === 'ADMIN_API__DELETION_DELAY_MILLISECONDS') {
						return noDelay ? 0 : 100;
					}
					return deletionTestConfig()[key];
				});

				const deletionRequest = deletionRequestFactory.buildWithId({ deleteAfter: new Date('2023-01-01') });
				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequest]);
				deletionRequestService.markDeletionRequestAsPending.mockResolvedValueOnce(true);

				return { deletionRequest };
			};
			it('should call deletionRequestService.findInProgressCount', async () => {
				setup();

				await uc.executeDeletionRequests();

				expect(deletionRequestService.findInProgressCount).toHaveBeenCalled();
			});

			it('should call deletionRequestService.findAllItemsToExecute with correct limit', async () => {
				setup();

				await uc.executeDeletionRequests();

				expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(1, undefined);
			});

			describe('when limit is given', () => {
				it('should call deletionRequestService.findAllItemsToExecute with correct limit', async () => {
					setup();

					await uc.executeDeletionRequests(10);

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(9, undefined);
				});
			});

			describe('when limit is not given', () => {
				it('should call deletionRequestService.findAllItemsToExecute with correct limit', async () => {
					setup();

					await uc.executeDeletionRequests();

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(1, undefined);
				});
			});

			describe('when getFailed is true', () => {
				it('should call deletionRequestService.findAllItemsToExecute with getFailed true', async () => {
					setup();

					await uc.executeDeletionRequests(undefined, true);

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(1, true);
				});
			});

			it('should call deletionRequestService.markDeletionRequestAsPending to update status of deletionRequests', async () => {
				const { deletionRequest } = setup();

				await uc.executeDeletionRequests();

				expect(deletionRequestService.markDeletionRequestAsPending).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should call eventBus.publish', async () => {
				const { deletionRequest } = setup();

				await uc.executeDeletionRequests();

				expect(eventBus.publish).toHaveBeenCalledWith(
					new UserDeletedEvent(deletionRequest.id, deletionRequest.targetRefId)
				);
			});

			it('should work with a delay of 0', async () => {
				setup(true);

				await uc.executeDeletionRequests();

				expect(deletionRequestService.markDeletionRequestAsFailed).not.toHaveBeenCalled();
			});
		});

		describe('when an error occurred', () => {
			const setup = () => {
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });

				configService.get.mockImplementation((key) => deletionTestConfig()[key]);

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				deletionRequestService.findInProgressCount.mockResolvedValueOnce(1);
				eventBus.publish.mockRejectedValueOnce(new Error());

				return {
					deletionRequestToExecute,
				};
			};

			it('should throw an arror', async () => {
				const { deletionRequestToExecute } = setup();

				await uc.executeDeletionRequests();

				expect(deletionRequestService.markDeletionRequestAsFailed).toHaveBeenCalledWith(deletionRequestToExecute.id);
			});
		});
	});

	describe('findById', () => {
		describe('when searching for logs for deletionRequest which was executed with success status', () => {
			const setup = () => {
				const deletionRequestExecuted = deletionRequestFactory.build({ status: StatusModel.SUCCESS });
				const deletionLogExecuted = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });

				const targetRef = DeletionTargetRefBuilder.build(
					deletionRequestExecuted.targetRefDomain,
					deletionRequestExecuted.targetRefId
				);
				const statistics: DomainDeletionReport = DomainDeletionReportBuilder.build(
					deletionLogExecuted.domain,
					deletionLogExecuted.operations,
					deletionLogExecuted.subdomainOperations
				);

				const executedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequestExecuted.deleteAfter,
					StatusModel.SUCCESS,
					[statistics]
				);

				return {
					deletionRequestExecuted,
					executedDeletionRequestSummary,
					deletionLogExecuted,
				};
			};

			it('should call to deletionRequestService and deletionLogService', async () => {
				const { deletionRequestExecuted } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);

				await uc.findById(deletionRequestExecuted.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequestExecuted.id);
				expect(deletionLogService.findByDeletionRequestId).toHaveBeenCalledWith(deletionRequestExecuted.id);
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequestExecuted, deletionLogExecuted, executedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);
				deletionLogService.findByDeletionRequestId.mockResolvedValueOnce([deletionLogExecuted]);

				const result = await uc.findById(deletionRequestExecuted.id);

				expect(result).toEqual(executedDeletionRequestSummary);
				expect(result.status).toEqual(StatusModel.SUCCESS);
			});
		});

		describe('when searching for logs for deletionRequest which was executed with failed status', () => {
			const setup = () => {
				const deletionRequestExecuted = deletionRequestFactory.build({ status: StatusModel.FAILED });
				const deletionLogExecuted = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });

				const targetRef = DeletionTargetRefBuilder.build(
					deletionRequestExecuted.targetRefDomain,
					deletionRequestExecuted.targetRefId
				);
				const statistics = DeletionLogStatisticBuilder.build(
					deletionLogExecuted.domain,
					deletionLogExecuted.operations,
					deletionLogExecuted.subdomainOperations
				);

				const executedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequestExecuted.deleteAfter,
					StatusModel.FAILED,
					[statistics]
				);

				return {
					deletionRequestExecuted,
					executedDeletionRequestSummary,
					deletionLogExecuted,
				};
			};

			it('should call to deletionRequestService and deletionLogService', async () => {
				const { deletionRequestExecuted } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);

				await uc.findById(deletionRequestExecuted.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequestExecuted.id);
				expect(deletionLogService.findByDeletionRequestId).toHaveBeenCalledWith(deletionRequestExecuted.id);
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequestExecuted, deletionLogExecuted, executedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);
				deletionLogService.findByDeletionRequestId.mockResolvedValueOnce([deletionLogExecuted]);

				const result = await uc.findById(deletionRequestExecuted.id);

				expect(result).toEqual(executedDeletionRequestSummary);
				expect(result.status).toEqual(StatusModel.FAILED);
			});
		});

		describe('when searching for logs for deletionRequest which was not executed', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				const targetRef = DeletionTargetRefBuilder.build(deletionRequest.targetRefDomain, deletionRequest.targetRefId);
				const notExecutedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequest.deleteAfter,
					StatusModel.REGISTERED,
					[]
				);

				return {
					deletionRequest,
					notExecutedDeletionRequestSummary,
				};
			};

			it('should call to deletionRequestService and deletionLogService', async () => {
				const { deletionRequest } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				await uc.findById(deletionRequest.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequest.id);
				expect(deletionLogService.findByDeletionRequestId).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequest, notExecutedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				const result = await uc.findById(deletionRequest.id);

				expect(result).toEqual(notExecutedDeletionRequestSummary);
				expect(result.status).toEqual(StatusModel.REGISTERED);
			});
		});
	});

	describe('deleteDeletionRequestById', () => {
		describe('when deleting a deletionRequestId', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();

				return {
					deletionRequest,
				};
			};

			it('should call the service deletionRequestService.deleteById', async () => {
				const { deletionRequest } = setup();

				await uc.deleteDeletionRequestById(deletionRequest.id);

				expect(deletionRequestService.deleteById).toHaveBeenCalledWith(deletionRequest.id);
			});
		});
	});
});
