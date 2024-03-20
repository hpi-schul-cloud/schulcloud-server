import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BatchDeletionUc } from './batch-deletion.uc';
import { BatchDeletionService, ReferencesService } from '../services';
import { QueueDeletionRequestOutput } from '../services/interface';
import { QueueDeletionRequestInputBuilder, QueueDeletionRequestOutputBuilder } from '../services/builder';
import { BatchDeletionSummary, BatchDeletionSummaryDetail, BatchDeletionSummaryOverallStatus } from './interface';
import { BatchDeletionSummaryDetailBuilder } from '../builder';

describe(BatchDeletionUc.name, () => {
	let module: TestingModule;
	let uc: BatchDeletionUc;
	let batchDeletionService: DeepMocked<BatchDeletionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BatchDeletionUc,
				{
					provide: BatchDeletionService,
					useValue: createMock<BatchDeletionService>(),
				},
			],
		}).compile();

		uc = module.get(BatchDeletionUc);
		batchDeletionService = module.get(BatchDeletionService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('uc should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('deleteRefsFromTxtFile', () => {
		describe('when called with valid arguments', () => {
			describe('when batch deletion service returns an expected amount of outputs', () => {
				describe('when only successful executions took place', () => {
					const setup = () => {
						const targetRefsCount = 3;

						const targetRefIds: string[] = [];
						const outputs: QueueDeletionRequestOutput[] = [];

						for (let i = 0; i < targetRefsCount; i += 1) {
							targetRefIds.push(new ObjectId().toHexString());
							outputs.push(QueueDeletionRequestOutputBuilder.buildSuccess(new ObjectId().toHexString(), new Date()));
						}

						ReferencesService.loadFromTxtFile = jest.fn().mockReturnValueOnce(targetRefIds);

						batchDeletionService.queueDeletionRequests.mockResolvedValueOnce([outputs[0], outputs[1], outputs[2]]);

						const targetRefDomain = 'school';
						const deleteInMinutes = 60;

						const expectedSummaryFieldsDetails: BatchDeletionSummaryDetail[] = [];

						for (let i = 0; i < targetRefIds.length; i += 1) {
							expectedSummaryFieldsDetails.push(
								BatchDeletionSummaryDetailBuilder.build(
									QueueDeletionRequestInputBuilder.build(targetRefDomain, targetRefIds[i], deleteInMinutes),
									outputs[i]
								)
							);
						}

						const expectedSummaryFields = {
							overallStatus: BatchDeletionSummaryOverallStatus.SUCCESS,
							successCount: 3,
							failureCount: 0,
							details: expectedSummaryFieldsDetails,
						};

						const refsFilePath = '/tmp/ids.txt';

						return { refsFilePath, targetRefDomain, deleteInMinutes, expectedSummaryFields };
					};

					it('should return proper summary with all the successes and a successful overall status', async () => {
						const { refsFilePath, targetRefDomain, deleteInMinutes, expectedSummaryFields } = setup();

						const summary: BatchDeletionSummary = await uc.deleteRefsFromTxtFile(
							refsFilePath,
							targetRefDomain,
							deleteInMinutes
						);

						expect(summary.executionTimeMilliseconds).toBeGreaterThan(0);
						expect(summary).toMatchObject(expectedSummaryFields);
					});
				});

				describe('when both successful and failed executions took place', () => {
					const setup = () => {
						const targetRefsCount = 3;

						const targetRefIds: string[] = [];

						for (let i = 0; i < targetRefsCount; i += 1) {
							targetRefIds.push(new ObjectId().toHexString());
						}

						const targetRefDomain = 'school';
						const deleteInMinutes = 60;

						ReferencesService.loadFromTxtFile = jest.fn().mockReturnValueOnce(targetRefIds);

						const outputs = [
							QueueDeletionRequestOutputBuilder.buildSuccess(new ObjectId().toHexString(), new Date()),
							QueueDeletionRequestOutputBuilder.buildError(new Error('some error occurred...')),
							QueueDeletionRequestOutputBuilder.buildSuccess(new ObjectId().toHexString(), new Date()),
						];

						batchDeletionService.queueDeletionRequests.mockResolvedValueOnce([outputs[0], outputs[1], outputs[2]]);

						const expectedSummaryFieldsDetails: BatchDeletionSummaryDetail[] = [];

						for (let i = 0; i < targetRefIds.length; i += 1) {
							expectedSummaryFieldsDetails.push(
								BatchDeletionSummaryDetailBuilder.build(
									QueueDeletionRequestInputBuilder.build(targetRefDomain, targetRefIds[i], deleteInMinutes),
									outputs[i]
								)
							);
						}

						const expectedSummaryFields = {
							overallStatus: BatchDeletionSummaryOverallStatus.FAILURE,
							successCount: 2,
							failureCount: 1,
							details: expectedSummaryFieldsDetails,
						};

						const refsFilePath = '/tmp/ids.txt';

						return { refsFilePath, targetRefDomain, deleteInMinutes, expectedSummaryFields };
					};

					it('should return proper summary with all the successes and failures', async () => {
						const { refsFilePath, targetRefDomain, deleteInMinutes, expectedSummaryFields } = setup();

						const summary: BatchDeletionSummary = await uc.deleteRefsFromTxtFile(
							refsFilePath,
							targetRefDomain,
							deleteInMinutes
						);

						expect(summary.executionTimeMilliseconds).toBeGreaterThan(0);
						expect(summary).toMatchObject(expectedSummaryFields);
					});
				});
			});

			describe('when batch deletion service returns an invalid amount of outputs', () => {
				const setup = () => {
					const targetRefsCount = 3;

					const targetRefIds: string[] = [];

					for (let i = 0; i < targetRefsCount; i += 1) {
						targetRefIds.push(new ObjectId().toHexString());
					}

					ReferencesService.loadFromTxtFile = jest.fn().mockReturnValueOnce(targetRefIds);

					const outputs: QueueDeletionRequestOutput[] = [];

					for (let i = 0; i < targetRefsCount - 1; i += 1) {
						targetRefIds.push(new ObjectId().toHexString());
						outputs.push(QueueDeletionRequestOutputBuilder.buildSuccess(new ObjectId().toHexString(), new Date()));
					}

					batchDeletionService.queueDeletionRequests.mockResolvedValueOnce(outputs);

					const refsFilePath = '/tmp/ids.txt';

					return { refsFilePath };
				};

				it('should throw an error', async () => {
					const { refsFilePath } = setup();

					const func = () => uc.deleteRefsFromTxtFile(refsFilePath);

					await expect(func()).rejects.toThrow();
				});
			});
		});
	});
});
