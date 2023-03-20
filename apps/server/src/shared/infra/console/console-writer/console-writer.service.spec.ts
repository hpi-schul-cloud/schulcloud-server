import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from './console-writer.service';

describe('ConsoleWriterService', () => {
	let module: TestingModule;
	let service: ConsoleWriterService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ConsoleWriterService],
		}).compile();

		service = module.get(ConsoleWriterService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
	describe('when logging on console writer', () => {
		it('should call spinner info with same input text', () => {
			// eslint-disable-next-line @typescript-eslint/dot-notation
			const spinnerSpy = jest.spyOn(service['spinner'], 'info');
			const someRandomText = 'random text';
			service.info(someRandomText);
			expect(spinnerSpy).toHaveBeenCalledWith(someRandomText);
			spinnerSpy.mockReset();
		});
		it('should call spinner warn with same input text', () => {
			// eslint-disable-next-line @typescript-eslint/dot-notation
			const spinnerSpy = jest.spyOn(service['spinner'], 'warn');
			const someRandomText = 'random text';
			service.warn(someRandomText);
			expect(spinnerSpy).toHaveBeenCalledWith(someRandomText);
			spinnerSpy.mockReset();
		});
		it('should call spinner succeed info with same input text', () => {
			// eslint-disable-next-line @typescript-eslint/dot-notation
			const spinnerSpy = jest.spyOn(service['spinner'], 'succeed');
			const someRandomText = 'random text';
			service.succeed(someRandomText);
			expect(spinnerSpy).toHaveBeenCalledWith(someRandomText);
			spinnerSpy.mockReset();
		});
	});
	describe('when starting console writer', () => {
		it('should call spinner start', () => {
			// eslint-disable-next-line @typescript-eslint/dot-notation
			const spinnerSpy = jest.spyOn(service['spinner'], 'start');
			service.start();
			expect(spinnerSpy).toHaveBeenCalled();
			spinnerSpy.mockReset();
		});
	});
});
