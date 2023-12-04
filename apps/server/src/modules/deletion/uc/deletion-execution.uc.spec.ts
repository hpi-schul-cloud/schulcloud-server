import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeletionClient } from '@modules/deletion-console';
import { DeletionExecutionUc } from './deletion-execution.uc';

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
		describe("when client doesn't throw any error", () => {
			const setup = () => {
				const limit = 1000;

				deletionClient.executeDeletions.mockResolvedValueOnce(undefined);

				return { limit };
			};

			it('should also not throw an error', async () => {
				const { limit } = setup();

				await expect(uc.triggerDeletionExecution(limit)).resolves.not.toThrow();
			});
		});

		describe('when client throws an error', () => {
			const setup = () => {
				const error = new Error('connection error');

				deletionClient.executeDeletions.mockRejectedValueOnce(error);
			};

			it('should also throw an error', async () => {
				setup();

				await expect(uc.triggerDeletionExecution()).rejects.toThrow();
			});
		});
	});
});
