import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { ConsoleWriterService } from '@infra/console';
import { DeletionExecutionUc } from '../uc';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { TriggerDeletionExecutionOptionsBuilder } from './builder';

describe(DeletionExecutionConsole.name, () => {
	let module: TestingModule;
	let console: DeletionExecutionConsole;
	let deletionExecutionUc: DeletionExecutionUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionExecutionConsole,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: DeletionExecutionUc,
					useValue: createMock<DeletionExecutionUc>(),
				},
			],
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
	});
});
