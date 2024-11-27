import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { defaultMikroOrmOptions } from '@shared/common';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionExecutionTriggerResultBuilder, TriggerDeletionExecutionOptionsBuilder } from './builder';
import { DeletionExecutionUc } from './uc';
import { DeletionConsoleModule } from './deletion-console.app.module';

describe(DeletionExecutionConsole.name, () => {
	let module: TestingModule;
	let console: DeletionExecutionConsole;
	let deletionExecutionUc: DeepMocked<DeletionExecutionUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [DeletionConsoleModule, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
		}).compile();

		console = module.get(DeletionExecutionConsole);
		deletionExecutionUc = module.get(DeletionExecutionUc);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('console should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('triggerDeletionExecution', () => {
		describe('when called with valid options', () => {
			const setup = () => {
				const limit = 1000;

				const options = TriggerDeletionExecutionOptionsBuilder.build(1000);

				return { limit, options };
			};

			it(`should call ${DeletionExecutionUc.name} with proper arguments`, async () => {
				const { limit, options } = setup();

				const spy = jest.spyOn(deletionExecutionUc, 'triggerDeletionExecution');

				await console.triggerDeletionExecution(options);

				expect(spy).toBeCalledWith(limit);
			});
		});

		describe(`when ${DeletionExecutionUc.name}'s triggerDeletionExecution() method doesn't throw an exception`, () => {
			const setup = () => {
				const options = TriggerDeletionExecutionOptionsBuilder.build(1000);

				deletionExecutionUc.triggerDeletionExecution.mockResolvedValueOnce(undefined);
				const spy = jest.spyOn(DeletionExecutionTriggerResultBuilder, 'buildSuccess');

				return { options, spy };
			};

			it('should prepare result indicating success', async () => {
				const { options, spy } = setup();

				await console.triggerDeletionExecution(options);

				expect(spy).toHaveBeenCalled();
			});
		});

		describe(`when ${DeletionExecutionUc.name}'s triggerDeletionExecution() method throws an exception`, () => {
			const setup = () => {
				const options = TriggerDeletionExecutionOptionsBuilder.build(1000);
				const err = new Error('some error occurred...');

				deletionExecutionUc.triggerDeletionExecution.mockRejectedValueOnce(err);
				const spy = jest.spyOn(DeletionExecutionTriggerResultBuilder, 'buildFailure');

				return { options, err, spy };
			};

			it('should prepare result indicating failure', async () => {
				const { options, err, spy } = setup();

				await console.triggerDeletionExecution(options);

				expect(spy).toHaveBeenCalledWith(err);
			});
		});
	});
});
