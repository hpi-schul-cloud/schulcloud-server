import { LegacyLogger } from '@core/logger';
import { NotFoundException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from '../../deletion.config';
import { DomainDeletionReportBuilder } from '../../domain/builder';
import { DomainDeletionReport } from '../../domain/interface';
import { DeletionExecutionService, DeletionLogService, DeletionRequestService } from '../../domain/service';
import { deletionLogFactory, deletionRequestFactory } from '../../domain/testing';
import { DomainName, StatusModel } from '../../domain/types';
import { DeletionRequestEntity } from '../../repo/entity';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyParams } from '../controller/dto';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../controller/dto/builder';
import { DeletionRequestUc } from './deletion-request.uc';

describe(DeletionRequestUc.name, () => {
	let module: TestingModule;
	let uc: DeletionRequestUc;
	let deletionRequestService: DeepMocked<DeletionRequestService>;
	let deletionLogService: DeepMocked<DeletionLogService>;
	let config: DeletionConfig;
	let legacyLogger: DeepMocked<LegacyLogger>;
	let deletionExecutionService: DeepMocked<DeletionExecutionService>;
	let accountService: DeepMocked<AccountService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities([DeletionRequestEntity]);

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
					provide: DELETION_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: DeletionExecutionService,
					useValue: createMock<DeletionExecutionService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		uc = module.get(DeletionRequestUc);
		deletionRequestService = module.get(DeletionRequestService);
		deletionLogService = module.get(DeletionLogService);
		config = module.get(DELETION_CONFIG_TOKEN);
		legacyLogger = module.get(LegacyLogger);
		deletionExecutionService = module.get(DeletionExecutionService);
		accountService = module.get(AccountService);
		userService = module.get(UserService);
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
				const deletionRequestToCreate: DeletionRequestBodyParams = {
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

			it('should call the service to check user exists if domain is DomainName.User', async () => {
				const { deletionRequestToCreate } = setup();

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(userService.findById).toHaveBeenCalledWith(deletionRequestToCreate.targetRef.id);
			});

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

			it('should call userService.flagAsDeleted if domain is DomainName.User', async () => {
				const { deletionRequestToCreate } = setup();

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(userService.flagAsDeleted).toHaveBeenCalledWith(deletionRequestToCreate.targetRef.id, expect.any(Date));
			});

			it('should call accountService.deactivateAccount if domain is DomainName.User', async () => {
				const { deletionRequestToCreate } = setup();

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(accountService.deactivateAccount).toHaveBeenCalledWith(
					deletionRequestToCreate.targetRef.id,
					expect.any(Date)
				);
			});

			it('should log a warning if account is not found', async () => {
				const { deletionRequestToCreate } = setup();
				accountService.deactivateAccount.mockRejectedValueOnce(new NotFoundException());

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(legacyLogger.warn).toHaveBeenCalled();
			});
		});
	});

	describe('executeDeletionRequests', () => {
		describe('when deletionRequests to execute exists', () => {
			const setup = () => {
				config.adminApiDeletionDeleteAfterMinutes = 1;
				config.adminApiDeletionModificationThresholdMs = 100;
				config.adminApiDeletionConsiderFailedAfterMs = 1000;
				config.adminApiDeletionExecutionBatchNumber = 2;

				const deletionRequest = deletionRequestFactory.buildWithId({ deleteAfter: new Date('2023-01-01') });
				deletionRequestService.findByIds.mockResolvedValueOnce([deletionRequest]);

				return { deletionRequest };
			};

			it('should call deletionRequestService.findAllItemsToExecute', async () => {
				const { deletionRequest } = setup();

				await uc.executeDeletionRequests([deletionRequest.id]);

				expect(deletionRequestService.findByIds).toHaveBeenCalledWith([deletionRequest.id]);
			});

			it('should call deletionExecutionService.executeDeletionRequest with the deletionRequest', async () => {
				const { deletionRequest } = setup();

				await uc.executeDeletionRequests([deletionRequest.id]);

				expect(deletionExecutionService.executeDeletionRequest).toHaveBeenCalledWith(deletionRequest);
			});
		});

		describe('when deletionRequests to execute do not exist', () => {
			it('should not call deletionRequestService.findAllItemsToExecute', async () => {
				deletionRequestService.findByIds.mockResolvedValueOnce([]);

				await uc.executeDeletionRequests([new ObjectId().toHexString()]);

				expect(deletionExecutionService.executeDeletionRequest).not.toHaveBeenCalled();
			});
		});
	});

	describe('findAllItemsToExecute', () => {
		describe('when deletionRequests to execute exists', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequest]);

				return { deletionRequest };
			};

			describe('with params', () => {
				it('should call deletionRequestService.findAllItemsToExecute with default limit', async () => {
					setup();

					await uc.findAllItemsToExecute();

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(2, undefined);
				});

				it('should call deletionRequestService.findAllItemsToExecute with given limit', async () => {
					setup();

					await uc.findAllItemsToExecute(10);

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(10, undefined);
				});

				it('should call deletionRequestService.findAllItemsToExecute with getFailed true', async () => {
					setup();

					await uc.findAllItemsToExecute(undefined, true);

					expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(2, true);
				});
			});

			it('should call deletionRequestService.findAllItemsToExecute', async () => {
				setup();

				await uc.findAllItemsToExecute();

				expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalledWith(2, undefined);
			});

			it('should return the deletionRequestIds', async () => {
				const { deletionRequest } = setup();

				const result = await uc.findAllItemsToExecute();

				expect(result).toEqual([deletionRequest.id]);
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

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				return {
					deletionRequest,
				};
			};

			it('should call the service deletionRequestService.findById', async () => {
				const { deletionRequest } = setup();

				await uc.deleteDeletionRequestById(deletionRequest.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should call the service deletionRequestService.deleteById', async () => {
				const { deletionRequest } = setup();

				await uc.deleteDeletionRequestById(deletionRequest.id);

				expect(deletionRequestService.deleteById).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should call the service accountService.reactivateAccount if domain is DomainName.User', async () => {
				const { deletionRequest } = setup();

				await uc.deleteDeletionRequestById(deletionRequest.id);

				expect(accountService.reactivateAccount).toHaveBeenCalledWith(deletionRequest.targetRefId);
			});
		});
	});
});
