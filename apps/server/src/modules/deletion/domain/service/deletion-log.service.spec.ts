import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletionLogRepo } from '../../repo';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '../builder';
import { deletionLogFactory } from '../testing';
import { DomainName, OperationType } from '../types';
import { DeletionLogEntry, DeletionLogService } from './deletion-log.service';

describe(DeletionLogService.name, () => {
	let module: TestingModule;
	let service: DeletionLogService;
	let deletionLogRepo: DeepMocked<DeletionLogRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionLogService,
				{
					provide: DeletionLogRepo,
					useValue: createMock<DeletionLogRepo>(),
				},
			],
		}).compile();

		service = module.get(DeletionLogService);
		deletionLogRepo = module.get(DeletionLogRepo);
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

	describe('createDeletionLog', () => {
		describe('when creating deletion log', () => {
			const setup = () => {
				const deletionLogEntry1: DeletionLogEntry = {
					deletionRequestId: '653e4833cc39e5907a1e18d2',
					domainDeletionReport: DomainDeletionReportBuilder.build(DomainName.USER, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 1, ['653e4833cc39e5907a1e18d3']),
					]),
				};

				const deletionLogEntry2: DeletionLogEntry = {
					deletionRequestId: '653e4833cc39e5907a1e18e2',
					domainDeletionReport: DomainDeletionReportBuilder.build(DomainName.CLASS, [
						DomainOperationReportBuilder.build(OperationType.UPDATE, 1, ['653e4833cc39e5907a1e18e3']),
					]),
				};

				return { deletionLogEntry1, deletionLogEntry2 };
			};

			describe('when called with one deletion log entry', () => {
				it('should call deletionLogRepo.create with one entry', async () => {
					const { deletionLogEntry1 } = setup();

					await service.createDeletionLog(deletionLogEntry1);

					expect(deletionLogRepo.create).toHaveBeenCalledWith([
						expect.objectContaining({
							id: expect.any(String),
							deletionRequestId: deletionLogEntry1.deletionRequestId,
							domain: deletionLogEntry1.domainDeletionReport.domain,
							operations: deletionLogEntry1.domainDeletionReport.operations,
							performedAt: expect.any(Date),
						}),
					]);
				});
			});

			describe('when called with many deletion log entries', () => {
				it('should call deletionLogRepo.create with one entry', async () => {
					const { deletionLogEntry1, deletionLogEntry2 } = setup();

					await service.createDeletionLog([deletionLogEntry1, deletionLogEntry2]);

					expect(deletionLogRepo.create).toHaveBeenCalledWith([
						expect.objectContaining({
							id: expect.any(String),
							deletionRequestId: deletionLogEntry1.deletionRequestId,
							domain: deletionLogEntry1.domainDeletionReport.domain,
							operations: deletionLogEntry1.domainDeletionReport.operations,
							performedAt: expect.any(Date),
						}),
						expect.objectContaining({
							id: expect.any(String),
							deletionRequestId: deletionLogEntry2.deletionRequestId,
							domain: deletionLogEntry2.domainDeletionReport.domain,
							operations: deletionLogEntry2.domainDeletionReport.operations,
							performedAt: expect.any(Date),
						}),
					]);
				});
			});
		});
	});

	describe('findByDeletionRequestId', () => {
		describe('when finding all logs for deletionRequestId', () => {
			const setup = () => {
				const deletionRequestId = new ObjectId().toHexString();
				const deletionLog1 = deletionLogFactory.build({ deletionRequestId });
				const deletionLog2 = deletionLogFactory.build({
					deletionRequestId,
					domain: DomainName.PSEUDONYMS,
				});
				const deletionLogs = [deletionLog1, deletionLog2];

				deletionLogRepo.findAllByDeletionRequestId.mockResolvedValue(deletionLogs);

				return { deletionRequestId, deletionLogs };
			};

			it('should call deletionLogRepo.findAllByDeletionRequestId', async () => {
				const { deletionRequestId } = setup();
				await service.findByDeletionRequestId(deletionRequestId);

				expect(deletionLogRepo.findAllByDeletionRequestId).toBeCalledWith(deletionRequestId);
			});

			it('should return array of two deletionLogs with deletionRequestId', async () => {
				const { deletionRequestId, deletionLogs } = setup();
				const result = await service.findByDeletionRequestId(deletionRequestId);

				expect(result).toHaveLength(2);
				expect(result).toEqual(deletionLogs);
			});
		});
	});
});
