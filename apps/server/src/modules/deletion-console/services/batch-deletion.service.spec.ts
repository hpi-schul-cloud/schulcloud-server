import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeletionClient, DeletionRequestOutput, DeletionRequestOutputBuilder } from '../deletion-client';
import { QueueDeletionRequestInputBuilder, QueueDeletionRequestOutputBuilder } from './builder';
import { BatchDeletionService } from './batch-deletion.service';

describe(BatchDeletionService.name, () => {
	let module: TestingModule;
	let service: BatchDeletionService;
	let deletionClient: DeepMocked<DeletionClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BatchDeletionService,
				{
					provide: DeletionClient,
					useValue: createMock<DeletionClient>(),
				},
			],
		}).compile();

		service = module.get(BatchDeletionService);
		deletionClient = module.get(DeletionClient);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('queueDeletionRequests', () => {
		describe('when called with valid inputs array and a requested delay between the client calls', () => {
			describe("when client doesn't throw any error", () => {
				const setup = () => {
					const inputs = [QueueDeletionRequestInputBuilder.build('user', new ObjectId().toHexString(), 60)];

					const requestId = new ObjectId().toHexString();
					const deletionPlannedAt = new Date();

					const queueDeletionRequestOutput: DeletionRequestOutput = DeletionRequestOutputBuilder.build(
						requestId,
						deletionPlannedAt
					);

					deletionClient.queueDeletionRequest.mockResolvedValueOnce(queueDeletionRequestOutput);

					const expectedOutput = QueueDeletionRequestOutputBuilder.buildSuccess(requestId, deletionPlannedAt);

					const expectedOutputs = [expectedOutput];

					return { inputs, expectedOutputs };
				};

				it('should return an output object with successful status info', async () => {
					const { inputs, expectedOutputs } = setup();

					const outputs = await service.queueDeletionRequests(inputs, 1);

					expect(outputs).toStrictEqual(expectedOutputs);
				});
			});

			describe('when client throws an error', () => {
				const setup = () => {
					const inputs = [QueueDeletionRequestInputBuilder.build('user', new ObjectId().toHexString(), 60)];

					const error = new Error('connection error');

					deletionClient.queueDeletionRequest.mockRejectedValueOnce(error);

					const expectedOutput = QueueDeletionRequestOutputBuilder.buildError(error);

					const expectedOutputs = [expectedOutput];

					return { inputs, expectedOutputs };
				};

				it('should return an output object with failure status info', async () => {
					const { inputs, expectedOutputs } = setup();

					const outputs = await service.queueDeletionRequests(inputs);

					expect(outputs).toStrictEqual(expectedOutputs);
				});
			});
		});
	});
});
