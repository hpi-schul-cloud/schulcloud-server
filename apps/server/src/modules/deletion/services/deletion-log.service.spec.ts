import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionLogRepo } from '../repo';
import { DeletionLogService } from './deletion-log.service';
import { deletionLogFactory } from '../domain/testing/factory/deletion-log.factory';
import { DomainOperationReportBuilder, DomainDeletionReportBuilder } from '../builder';
import { DomainName, OperationType } from '../types';

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
				const deletionRequestId = '653e4833cc39e5907a1e18d2';
				const domain = DomainName.USER;
				const operations = [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
				];

				const domainDeletionReport = DomainDeletionReportBuilder.build(domain, operations);

				return { deletionRequestId, domainDeletionReport, operations };
			};

			it('should call deletionRequestRepo.create', async () => {
				const { deletionRequestId, domainDeletionReport, operations } = setup();

				await service.createDeletionLog(deletionRequestId, domainDeletionReport);

				expect(deletionLogRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						performedAt: expect.any(Date),
						deletionRequestId,
						operations,
					})
				);
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
