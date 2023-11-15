import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeletionClient } from '../client';
import { DeletionExecutionUc } from './deletion-execution.uc';
import { DeletionExecutionTriggerResultBuilder } from './builder';

describe(DeletionExecutionUc.name, () => {
	let module: TestingModule;
	let uc: DeletionExecutionUc;
	let deletionClient: DeepMocked<DeletionClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionExecutionUc,
				{
					provide: DeletionClient,
					useValue: createMock<DeletionClient>(),
				},
			],
		}).compile();

		uc = module.get(DeletionExecutionUc);
		deletionClient = module.get(DeletionClient);
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

	describe('triggerDeletionExecution', () => {
		describe('when called with valid input', () => {
			describe("when client doesn't throw any error", () => {
				const setup = () => {
					const limit = 1000;

					deletionClient.executeDeletions.mockResolvedValueOnce(undefined);

					const expectedOutput = DeletionExecutionTriggerResultBuilder.buildSuccess();

					return { limit, expectedOutput };
				};

				it('should return an object with the result containing a successful status info', async () => {
					const { limit, expectedOutput } = setup();

					const output = await uc.triggerDeletionExecution(limit);

					expect(output).toStrictEqual(expectedOutput);
				});
			});

			describe('when client throws an error', () => {
				const setup = () => {
					const error = new Error('connection error');

					deletionClient.executeDeletions.mockRejectedValueOnce(error);

					const expectedOutput = DeletionExecutionTriggerResultBuilder.buildFailure(error);

					return { expectedOutput };
				};

				it('should return an object with the result containing a failure status info with proper error message', async () => {
					const { expectedOutput } = setup();

					const output = await uc.triggerDeletionExecution();

					expect(output).toStrictEqual(expectedOutput);
				});
			});
		});
	});
});
