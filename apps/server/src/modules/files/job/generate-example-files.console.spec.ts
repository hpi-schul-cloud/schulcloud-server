import { createMock } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { GenerateExampleFilesConsole } from './generate-example-files.console';
import { GenerateExampleFilesUc } from './generate-example-files.uc';

describe('GenerateExampleFilesConsole', () => {
	let console: GenerateExampleFilesConsole;
	let generateExampleFilesUc: GenerateExampleFilesUc;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [],
			providers: [
				GenerateExampleFilesConsole,
				{
					provide: GenerateExampleFilesUc,
					useValue: createMock<GenerateExampleFilesUc>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(GenerateExampleFilesConsole);
		generateExampleFilesUc = module.get(GenerateExampleFilesUc);

		// Set fake system time. Otherwise, dates constructed in the test and the
		// console can differ because of the short time elapsing between the calls.
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2022, 1, 22));
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('generateExampleFiles', () => {
		it('should call UC with config path', async () => {
			const configPath = 'path/to/config.json';

			await console.generateExampleFiles(configPath);

			expect(generateExampleFilesUc.generate).toHaveBeenCalledWith(configPath);
		});

		it('should call UC remove if the remove option is set', async () => {
			const configPath = 'path/to/config.json';

			await console.generateExampleFiles(configPath, { remove: true });

			expect(generateExampleFilesUc.remove).toHaveBeenCalledWith(configPath);
		});
	});
});
