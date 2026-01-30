import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { DeletionExecutionTriggerResultBuilder, TriggerDeletionExecutionOptionsBuilder } from './builder';
import { DeletionConsoleModule } from './deletion-console.app.module';
import { DELETION_CONSOLE_CONFIG_TOKEN } from './deletion-console.config';
import { TEST_ENTITIES } from './deletion-console.entity.imports';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { TriggerDeletionExecutionOptions } from './interface';
import { DeletionExecutionUc } from './uc';

describe(DeletionExecutionConsole.name, () => {
	let module: TestingModule;
	let console: DeletionExecutionConsole;
	let deletionExecutionUc: DeepMocked<DeletionExecutionUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				DeletionConsoleModule,
				MongoMemoryDatabaseModule.forRoot({ ...findOneOrFailHandler, entities: TEST_ENTITIES }),
			],
		})
			.overrideProvider(DELETION_CONSOLE_CONFIG_TOKEN)
			.useValue({
				adminApiClientBaseUrl: 'http://api-admin:4030',
				adminApiClientApiKey: '652559c2-93da-42ad-94e1-640e3afbaca0',
			})
			.compile();

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

				const options = TriggerDeletionExecutionOptionsBuilder.build(1000, false);

				jest.spyOn(deletionExecutionUc, 'triggerDeletionExecution').mockResolvedValueOnce(undefined);

				return { limit, options };
			};

			it(`should call ${DeletionExecutionUc.name} with proper arguments`, async () => {
				const { limit, options } = setup();

				await console.triggerDeletionExecution(options);

				expect(deletionExecutionUc.triggerDeletionExecution).toBeCalledWith(limit, false);
			});
		});

		describe(`when ${DeletionExecutionUc.name}'s triggerDeletionExecution() method doesn't throw an exception`, () => {
			const setup = () => {
				const options = TriggerDeletionExecutionOptionsBuilder.build(1000, false);

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
				const options = TriggerDeletionExecutionOptionsBuilder.build(1000, false);
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

		describe('when runFailed is given as string "true"', () => {
			it('should convert runFailed to boolean', async () => {
				const options = { limit: 1000, runFailed: 'true' } as unknown as TriggerDeletionExecutionOptions;

				const spy = jest.spyOn(deletionExecutionUc, 'triggerDeletionExecution').mockResolvedValueOnce(undefined);

				await console.triggerDeletionExecution(options);

				expect(spy).toHaveBeenCalledWith(1000, true);
			});
		});

		describe('when limit is a string "5"', () => {
			it('should convert limit to number', async () => {
				const options = { limit: '5', runFailed: false } as unknown as TriggerDeletionExecutionOptions;

				const spy = jest.spyOn(deletionExecutionUc, 'triggerDeletionExecution').mockResolvedValueOnce(undefined);

				await console.triggerDeletionExecution(options);

				expect(spy).toHaveBeenCalledWith(5, false);
			});
		});
	});
});
